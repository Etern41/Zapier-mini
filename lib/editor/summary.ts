import type { NodeType } from "@prisma/client";

export function buildNodeSummary(
  type: NodeType,
  config: Record<string, unknown>
): { summary: string; configured: boolean } {
  switch (type) {
    case "TRIGGER_WEBHOOK": {
      const method = (config.method as string) || "POST";
      return { summary: `Webhook · ${method}`, configured: true };
    }
    case "TRIGGER_SCHEDULE": {
      const f = (config.frequency as string) || "daily";
      return { summary: `Schedule · ${f}`, configured: true };
    }
    case "TRIGGER_EMAIL": {
      const host = config.imapHost as string | undefined;
      return {
        summary: host ? `IMAP · ${host}` : "",
        configured: Boolean(host),
      };
    }
    case "ACTION_HTTP": {
      const url = config.url as string | undefined;
      const method = (config.method as string) || "GET";
      return {
        summary: url ? `${method} · ${truncate(url, 40)}` : "",
        configured: Boolean(url),
      };
    }
    case "ACTION_EMAIL": {
      const to = config.to as string | undefined;
      return {
        summary: to ? `To: ${to}` : "",
        configured: Boolean(to),
      };
    }
    case "ACTION_TELEGRAM": {
      const chat = config.chatId as string | undefined;
      return {
        summary: chat ? `Chat ${chat}` : "",
        configured: Boolean(chat),
      };
    }
    case "ACTION_DB": {
      const op = (config.operation as string) || "SELECT";
      return { summary: `DB · ${op}`, configured: Boolean(config.query) };
    }
    case "ACTION_TRANSFORM": {
      const op = (config.operation as string) || "parse_json";
      return { summary: `Transform · ${op}`, configured: true };
    }
    default:
      return { summary: "", configured: false };
  }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n)}…`;
}

export function nodeStatus(
  configured: boolean,
  workflowActive: boolean
): "draft" | "active" | "error" {
  if (!configured) return "draft";
  if (workflowActive) return "active";
  return "draft";
}
