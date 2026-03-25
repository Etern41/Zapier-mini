"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  emailActionConfigSchema,
  type EmailActionConfigInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { safeDebouncedConfig } from "@/lib/editor/debounced-config";
import { patchNode } from "@/lib/editor/patch-node";

export function EmailActionConfig({
  nodeId,
  initial,
  onSaved,
}: {
  nodeId: string;
  initial: unknown;
  onSaved: () => void;
}) {
  const parsedInit = emailActionConfigSchema.safeParse(initial ?? {});
  const defaults = parsedInit.success
    ? parsedInit.data
    : { to: "", subject: "", body: "", fromName: "" };

  const form = useForm<EmailActionConfigInput>({
    resolver: zodResolver(emailActionConfigSchema),
    defaultValues: defaults,
  });

  const { watch, register, handleSubmit, formState } = form;
  const values = watch();
  const debounceKey = JSON.stringify(values);

  useEffect(() => {
    const t = setTimeout(() => {
      const cfg = safeDebouncedConfig(debounceKey, emailActionConfigSchema);
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
        <AlertDescription className="text-xs">
          Используйте {"{{nodeId.field}}"} для данных из предыдущих шагов
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>To</Label>
        <Input type="email" {...register("to")} />
      </div>
      <div className="space-y-2">
        <Label>Subject</Label>
        <Input maxLength={200} {...register("subject")} />
        <p className="text-xs text-muted-foreground">
          {values.subject?.length ?? 0}/200
        </p>
      </div>
      <div className="space-y-2">
        <Label>Body</Label>
        <Textarea maxLength={5000} rows={8} {...register("body")} />
        <p className="text-xs text-muted-foreground">
          {values.body?.length ?? 0}/5000
        </p>
      </div>
      <div className="space-y-2">
        <Label>From name</Label>
        <Input maxLength={100} {...register("fromName")} />
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
