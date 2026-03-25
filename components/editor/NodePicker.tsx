"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Webhook,
  Calendar,
  Mail,
  Globe,
  Send,
  Database,
  Shuffle,
} from "lucide-react";
import type { PickerKey } from "@/lib/editor/node-meta";

const triggerOptions: { key: PickerKey; icon: typeof Webhook; name: string; desc: string }[] = [
  { key: "webhook", icon: Webhook, name: "Webhook", desc: "Receive HTTP requests" },
  { key: "schedule", icon: Calendar, name: "Расписание", desc: "Run on a schedule" },
  { key: "email_trigger", icon: Mail, name: "Email", desc: "Triggered by incoming email" },
];

const actionOptions: { key: PickerKey; icon: typeof Globe; name: string; desc: string }[] = [
  { key: "http", icon: Globe, name: "HTTP Request", desc: "Make API calls" },
  { key: "email", icon: Mail, name: "Email", desc: "Send an email" },
  { key: "telegram", icon: Send, name: "Telegram", desc: "Send Telegram message" },
  { key: "db", icon: Database, name: "Database", desc: "Query your database" },
  { key: "transform", icon: Shuffle, name: "Transform", desc: "Process and transform data" },
];

export function NodePicker({
  open,
  onOpenChange,
  hasTrigger,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  hasTrigger: boolean;
  onPick: (key: PickerKey) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a step</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto">
          {!hasTrigger ? (
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">
                Triggers
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {triggerOptions.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:border-violet-400 hover:bg-muted/50"
                    onClick={() => {
                      onPick(o.key);
                      onOpenChange(false);
                    }}
                  >
                    <o.icon className="size-5 text-violet-500" />
                    <span className="font-medium">{o.name}</span>
                    <span className="text-xs text-muted-foreground">{o.desc}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          <section>
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {actionOptions.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:border-violet-400 hover:bg-muted/50"
                  onClick={() => {
                    onPick(o.key);
                    onOpenChange(false);
                  }}
                >
                  <o.icon className="size-5 text-blue-500" />
                  <span className="font-medium">{o.name}</span>
                  <span className="text-xs text-muted-foreground">{o.desc}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
