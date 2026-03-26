"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LIMITS,
  emailTriggerConfigSchema,
  emailTriggerConfigPartialSchema,
  type EmailTriggerPartialFormValues,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { safeDebouncedConfig } from "@/lib/editor/debounced-config";
import { patchNode } from "@/lib/editor/patch-node";

export function EmailTriggerConfig({
  nodeId,
  initial,
  onSaved,
}: {
  nodeId: string;
  initial: unknown;
  onSaved: () => void;
}) {
  const parsedInit = emailTriggerConfigSchema.safeParse(initial ?? {});
  const defaults = parsedInit.success
    ? parsedInit.data
    : {
        imapHost: "",
        imapPort: 993,
        email: "",
        password: "",
        filterSubject: "",
      };

  const form = useForm<EmailTriggerPartialFormValues>({
    resolver: zodResolver(emailTriggerConfigPartialSchema),
    defaultValues: defaults,
  });

  const { watch, register, handleSubmit, formState } = form;
  const values = watch();
  const debounceKey = JSON.stringify(values);

  useEffect(() => {
    const t = setTimeout(() => {
      const cfg = safeDebouncedConfig(
        debounceKey,
        emailTriggerConfigPartialSchema
      );
      if (!cfg) return;
      void patchNode(nodeId, { config: cfg });
    }, 500);
    return () => clearTimeout(t);
  }, [debounceKey, nodeId]);

  const saveNow = handleSubmit(async (data) => {
    const full = emailTriggerConfigSchema.safeParse(data);
    if (!full.success) {
      const first = full.error.flatten().fieldErrors;
      const msg =
        Object.values(first).flat()[0] ?? "Проверьте поля и сохраните снова";
      toast.error(msg);
      return;
    }
    const ok = await patchNode(nodeId, { config: full.data });
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
          Почта проверяется раз в 5 минут. Нужен IMAP и, у крупных почт, пароль
          приложения. Воркфлоу должен быть опубликован.
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>Сервер IMAP</Label>
        <Input
          placeholder="imap.gmail.com"
          maxLength={LIMITS.imapHost}
          {...register("imapHost")}
        />
      </div>
      <div className="space-y-2">
        <Label>Порт IMAP</Label>
        <Input type="number" {...register("imapPort")} />
      </div>
      <div className="space-y-2">
        <Label>Адрес почты</Label>
        <Input
          type="email"
          maxLength={LIMITS.email}
          {...register("email")}
        />
      </div>
      <div className="space-y-2">
        <Label>Пароль или пароль приложения</Label>
        <Input
          type="password"
          maxLength={LIMITS.imapPassword}
          {...register("password")}
        />
      </div>
      <div className="space-y-2">
        <Label>Фильтр по теме (необязательно)</Label>
        <Input
          placeholder="Только письма, где тема содержит эту строку"
          maxLength={LIMITS.filterSubject}
          {...register("filterSubject")}
        />
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
