import type { LucideIcon } from "lucide-react";
import {
  Webhook,
  Calendar,
  Mail,
  Globe,
  Send,
  Database,
  Shuffle,
} from "lucide-react";
import type { NodeType } from "@prisma/client";

const map: Partial<Record<NodeType, LucideIcon>> = {
  TRIGGER_WEBHOOK: Webhook,
  TRIGGER_SCHEDULE: Calendar,
  TRIGGER_EMAIL: Mail,
  ACTION_HTTP: Globe,
  ACTION_EMAIL: Mail,
  ACTION_TELEGRAM: Send,
  ACTION_DB: Database,
  ACTION_TRANSFORM: Shuffle,
};

export function workflowNodeIcons(types: { type: NodeType }[]): LucideIcon[] {
  const seen = new Set<NodeType>();
  const out: LucideIcon[] = [];
  for (const { type } of types) {
    if (seen.has(type)) continue;
    seen.add(type);
    const Icon = map[type];
    if (Icon) out.push(Icon);
  }
  return out;
}
