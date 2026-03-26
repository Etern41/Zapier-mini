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
  hint: string;
}[] = [
  {
    key: "webhook",
    icon: Webhook,
    name: "Webhook",
    desc: "Запуск по HTTP-запросу",
    hint: "Нужны опубликованный воркфлоу, воркер и верный публичный адрес сайта.",
  },
  {
    key: "schedule",
    icon: Calendar,
    name: "Расписание",
    desc: "По расписанию (cron)",
    hint: "Воркфлоу опубликован, воркер запущен; время — в выбранном часовом поясе.",
  },
  {
    key: "email_trigger",
    icon: Mail,
    name: "Email",
    desc: "Входящее письмо (IMAP)",
    hint: "IMAP у провайдера, пароль приложения (Gmail и т.п.), опрос раз в 5 мин.",
  },
];

const actionOptions: {
  key: PickerKey;
  icon: typeof Globe;
  name: string;
  desc: string;
  hint: string;
}[] = [
  {
    key: "http",
    icon: Globe,
    name: "HTTP-запрос",
    desc: "Вызов внешнего API",
    hint: "Подстановки {{id_узла.поле}}; URL и тело — как в обычном fetch.",
  },
  {
    key: "email",
    icon: Mail,
    name: "Email",
    desc: "Отправка письма",
    hint: "Почта настраивается в окружении сервера; в теме и тексте — {{id_узла.поле}}.",
  },
  {
    key: "telegram",
    icon: Send,
    name: "Telegram",
    desc: "Сообщение в Telegram",
    hint: "Токен бота и chat_id в настройках шага.",
  },
  {
    key: "db",
    icon: Database,
    name: "База данных",
    desc: "SQL-запрос",
    hint: "Та же база, что у приложения; только осознанные запросы.",
  },
  {
    key: "transform",
    icon: Shuffle,
    name: "Трансформация данных",
    desc: "JSON, поля, массивы",
    hint: "Между шагами: разбор JSON, поля, массивы, даты, простая математика.",
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
      <DialogContent className="z-[120] max-h-[min(92dvh,720px)] w-[calc(100vw-1rem)] max-w-xl gap-3 overflow-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Добавить шаг</DialogTitle>
        </DialogHeader>
        <div className="max-h-[min(78dvh,560px)] space-y-5 overflow-y-auto pr-1 sm:space-y-6">
          <section>
            <h3 className="section-label mb-2 px-0">Триггеры</h3>
            {hasTrigger ? (
              <p className="mb-2 text-xs text-muted-foreground">
                В воркфлоу уже есть триггер. Добавление второго заменит стартовую
                точку.
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  <span className="text-[11px] leading-snug text-muted-foreground/90">
                    {o.hint}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="section-label mb-2 px-0">Действия</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  <span className="text-[11px] leading-snug text-muted-foreground/90">
                    {o.hint}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
