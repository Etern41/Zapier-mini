"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
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
    if (!full.success) return;
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
        <AlertDescription className="text-xs">
          Проверка почты каждые 5 минут
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>IMAP Host</Label>
        <Input {...register("imapHost")} />
      </div>
      <div className="space-y-2">
        <Label>IMAP Port</Label>
        <Input type="number" {...register("imapPort")} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" {...register("email")} />
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input type="password" {...register("password")} />
      </div>
      <div className="space-y-2">
        <Label>Filter subject</Label>
        <Input placeholder="Опционально" {...register("filterSubject")} />
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
