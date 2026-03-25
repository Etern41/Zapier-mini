import type { NodeType } from "@prisma/client";

export const NODE_TYPE_MAP: Record<
  string,
  { type: NodeType; label: string; isTrigger: boolean }
> = {
  webhook: { type: "TRIGGER_WEBHOOK", label: "Webhook", isTrigger: true },
  schedule: { type: "TRIGGER_SCHEDULE", label: "Расписание", isTrigger: true },
  email_trigger: {
    type: "TRIGGER_EMAIL",
    label: "Email",
    isTrigger: true,
  },
  http: { type: "ACTION_HTTP", label: "HTTP Request", isTrigger: false },
  email: { type: "ACTION_EMAIL", label: "Email", isTrigger: false },
  telegram: { type: "ACTION_TELEGRAM", label: "Telegram", isTrigger: false },
  db: { type: "ACTION_DB", label: "Database", isTrigger: false },
  transform: {
    type: "ACTION_TRANSFORM",
    label: "Transform",
    isTrigger: false,
  },
};

export type PickerKey = keyof typeof NODE_TYPE_MAP;
