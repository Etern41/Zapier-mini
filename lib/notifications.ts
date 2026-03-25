import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export async function notifyWorkflowFailure(
  workflowId: string,
  errorMessage: string
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const wf = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { user: true },
  });
  if (!wf?.user?.email) return;

  const resend = new Resend(key);
  try {
    await resend.emails.send({
      from: "AutoFlow <onboarding@resend.dev>",
      to: wf.user.email,
      subject: `Workflow failed: ${wf.name}`,
      text: `Your workflow "${wf.name}" failed.\n\n${errorMessage}`,
    });
  } catch {
    // best-effort notification
  }
}
