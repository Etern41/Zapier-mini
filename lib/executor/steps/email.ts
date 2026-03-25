import { Resend } from "resend";
import type { RecordStringUnknown } from "@/lib/executor/types";

type EmailCfg = {
  to?: string;
  subject?: string;
  body?: string;
  fromName?: string;
};

export async function runEmailStep(
  config: RecordStringUnknown
): Promise<unknown> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");

  const c = config as EmailCfg;
  if (!c.to) throw new Error("Email recipient is required");

  const resend = new Resend(key);
  const from =
    c.fromName && c.fromName.length > 0
      ? `${c.fromName} <onboarding@resend.dev>`
      : "AutoFlow <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to: c.to,
    subject: c.subject ?? "(no subject)",
    text: c.body ?? "",
  });

  if (error) throw new Error(error.message);
  return { id: data?.id };
}
