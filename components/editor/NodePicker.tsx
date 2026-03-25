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

const triggerOptions: {
  key: PickerKey;
  icon: typeof Webhook;
  name: string;
  desc: string;
}[] = [
  {
    key: "webhook",
    icon: Webhook,
    name: "Webhook",
    desc: "Запуск по HTTP-запросу",
  },
  {
    key: "schedule",
    icon: Calendar,
    name: "Расписание",
    desc: "По расписанию (cron)",
  },
  {
    key: "email_trigger",
    icon: Mail,
    name: "Email",
    desc: "Входящее письмо (IMAP)",
  },
];

const actionOptions: {
  key: PickerKey;
  icon: typeof Globe;
  name: string;
  desc: string;
}[] = [
  {
    key: "http",
    icon: Globe,
    name: "HTTP-запрос",
    desc: "Вызов внешнего API",
  },
  {
    key: "email",
    icon: Mail,
    name: "Email",
    desc: "Отправка письма",
  },
  {
    key: "telegram",
    icon: Send,
    name: "Telegram",
    desc: "Сообщение в Telegram",
  },
  {
    key: "db",
    icon: Database,
    name: "База данных",
    desc: "SQL-запрос",
  },
  {
    key: "transform",
    icon: Shuffle,
    name: "Трансформация данных",
    desc: "JSON, поля, массивы",
  },
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
      <DialogContent className="z-[120] max-w-lg">
        <DialogHeader>
          <DialogTitle>Добавить шаг</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto">
          {!hasTrigger ? (
            <section>
              <h3 className="section-label mb-2 px-0">Триггеры</h3>
              <div className="grid grid-cols-2 gap-2">
                {triggerOptions.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left text-sm shadow-card-zapier transition-colors hover:border-primary/40 hover:bg-muted/50"
                    onClick={() => {
                      onPick(o.key);
                      onOpenChange(false);
                    }}
                  >
                    <o.icon className="size-5 text-[#FF4A00]" />
                    <span className="font-medium text-foreground">{o.name}</span>
                    <span className="text-xs text-muted-foreground">{o.desc}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          <section>
            <h3 className="section-label mb-2 px-0">Действия</h3>
            <div className="grid grid-cols-2 gap-2">
              {actionOptions.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left text-sm shadow-card-zapier transition-colors hover:border-[hsl(var(--brand-purple))]/50 hover:bg-muted/50"
                  onClick={() => {
                    onPick(o.key);
                    onOpenChange(false);
                  }}
                >
                  <o.icon className="size-5 text-[hsl(var(--brand-purple))]" />
                  <span className="font-medium text-foreground">{o.name}</span>
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
