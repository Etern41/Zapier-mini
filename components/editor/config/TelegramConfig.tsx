"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LIMITS,
  telegramConfigSchema,
  type TelegramConfigInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { safeDebouncedConfig } from "@/lib/editor/debounced-config";
import { patchNode } from "@/lib/editor/patch-node";

const modeUi = [
  { v: "text" as const, label: "Обычный" },
  { v: "markdown" as const, label: "Markdown" },
  { v: "html" as const, label: "HTML" },
];

export function TelegramConfig({
  nodeId,
  initial,
  onSaved,
}: {
  nodeId: string;
  initial: unknown;
  onSaved: () => void;
}) {
  const parsedInit = telegramConfigSchema.safeParse(initial ?? {});
  const defaults = parsedInit.success
    ? parsedInit.data
    : {
        botToken: "",
        chatId: "",
        message: "",
        parseMode: "text" as const,
      };

  const form = useForm<TelegramConfigInput>({
    resolver: zodResolver(telegramConfigSchema),
    defaultValues: defaults,
  });

  const { watch, register, handleSubmit, setValue, formState } = form;
  const values = watch();
  const debounceKey = JSON.stringify(values);

  useEffect(() => {
    const t = setTimeout(() => {
      const cfg = safeDebouncedConfig(debounceKey, telegramConfigSchema);
      if (!cfg) return;
      void patchNode(nodeId, { config: cfg });
    }, 500);
    return () => clearTimeout(t);
  }, [debounceKey, nodeId]);

  const saveNow = handleSubmit(async (data) => {
    const ok = await patchNode(nodeId, { config: data });
    if (!ok) {
      toast.error("Не удалось сохранить настройки");
      return;
    }
    onSaved();
  });

  return (
    <form className="space-y-4" onSubmit={(e) => void saveNow(e)}>
      <Alert>
        <AlertDescription className="text-xs text-muted-foreground">
          В тексте сообщения можно писать{" "}
          <code className="rounded bg-muted px-1">{"{{id_узла.поле}}"}</code>.
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>Токен бота</Label>
        <Input
          type="password"
          maxLength={LIMITS.telegramToken}
          {...register("botToken")}
        />
        <a
          href="https://core.telegram.org/bots/tutorial"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline"
        >
          Как получить токен?
        </a>
      </div>
      <div className="space-y-2">
        <Label>ID чата</Label>
        <Input maxLength={LIMITS.telegramChatId} {...register("chatId")} />
        <a
          href="https://t.me/userinfobot"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary underline"
        >
          Как найти Chat ID?
        </a>
      </div>
      <div className="space-y-2">
        <Label>Сообщение</Label>
        <Textarea
          maxLength={LIMITS.telegramMessage}
          rows={6}
          {...register("message")}
        />
        <p className="text-xs text-muted-foreground">
          {values.message?.length ?? 0}/{LIMITS.telegramMessage}
        </p>
      </div>
      <div className="space-y-2">
        <Label>Разметка</Label>
        <Select
          value={values.parseMode}
          onValueChange={(v) =>
            setValue("parseMode", v as TelegramConfigInput["parseMode"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modeUi.map((m) => (
              <SelectItem key={m.v} value={m.v}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {Object.keys(formState.errors).length > 0 ? (
        <p className="text-xs text-destructive">Проверьте поля</p>
      ) : null}
      <Button type="submit" className="w-full">
        Сохранить
      </Button>
    </form>
  );
}
