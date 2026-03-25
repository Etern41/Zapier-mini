import { ImapFlow } from "imapflow";
import type { WorkflowNode } from "@prisma/client";
import { enqueueWorkflowRun } from "@/lib/queue/client";

type EmailCfg = {
  imapHost?: string;
  imapPort?: number | string;
  email?: string;
  password?: string;
  filterSubject?: string;
};

function resolveImapPort(raw: number | string | undefined): number {
  if (raw === undefined || raw === "") return 993;
  const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : 993;
}

export async function pollEmailTriggerOnce(
  workflowId: string,
  node: WorkflowNode
): Promise<void> {
  const cfg = (node.config ?? {}) as EmailCfg;
  if (!cfg.imapHost || !cfg.email || !cfg.password) return;

  const client = new ImapFlow({
    host: cfg.imapHost,
    port: resolveImapPort(cfg.imapPort),
    secure: true,
    auth: { user: cfg.email, pass: cfg.password },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const msg of client.fetch(
        { seen: false },
        { envelope: true, uid: true }
      )) {
        const subj = msg.envelope?.subject ?? "";
        if (cfg.filterSubject && !subj.includes(cfg.filterSubject)) continue;
        await enqueueWorkflowRun({
          workflowId,
          triggerData: {
            subject: subj,
            from: msg.envelope?.from?.map((a) => a.address).join(", "),
            uid: msg.uid,
          },
          trigger: "email",
        });
        if (msg.uid) await client.messageFlagsAdd({ uid: msg.uid }, ["\\Seen"]);
      }
    } finally {
      lock.release();
    }
  } catch {
    // IMAP errors — skip cycle
  } finally {
    await client.logout().catch(() => undefined);
  }
}

export async function pollAllEmailTriggers(
  entries: Array<{ workflowId: string; node: WorkflowNode }>
): Promise<void> {
  for (const e of entries) {
    await pollEmailTriggerOnce(e.workflowId, e.node);
  }
}
