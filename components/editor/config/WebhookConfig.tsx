"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clipboard } from "lucide-react";
import { toast } from "sonner";
import {
  webhookConfigSchema,
  type WebhookConfigInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeDebouncedConfig } from "@/lib/editor/debounced-config";
import { patchNode } from "@/lib/editor/patch-node";

export function WebhookConfig({
  workflowId,
  nodeId,
  initial,
  onSaved,
}: {
  workflowId: string;
  nodeId: string;
  initial: unknown;
  onSaved: () => void;
}) {
  const base =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string"
      ? process.env.NEXT_PUBLIC_APP_URL
      : "";
  const url = `${base.replace(/\/$/, "")}/api/webhooks/${workflowId}`;

  const parsedInit = webhookConfigSchema.safeParse(initial ?? {});
  const defaults = parsedInit.success
    ? parsedInit.data
    : { method: "POST" as const, secret: "" };

  const form = useForm<WebhookConfigInput>({
    resolver: zodResolver(webhookConfigSchema),
    defaultValues: defaults,
  });

  const { watch, register, handleSubmit, setValue, formState } = form;
  const values = watch();
  const debounceKey = JSON.stringify(values);

  useEffect(() => {
    const t = setTimeout(() => {
      const cfg = safeDebouncedConfig(debounceKey, webhookConfigSchema);
      if (!cfg) return;
      void patchNode(nodeId, { config: cfg }).then((ok) => {
        if (ok) onSaved();
      });
    }, 500);
    return () => clearTimeout(t);
  }, [debounceKey, nodeId, onSaved]);

  const saveNow = handleSubmit(async (data) => {
    await patchNode(nodeId, { config: data });
    onSaved();
  });

  return (
    <form className="space-y-4" onSubmit={(e) => void saveNow(e)}>
      <div className="space-y-2">
        <Label>Webhook URL</Label>
        <div className="flex gap-2">
          <Input readOnly value={url} className="font-mono text-xs" />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              void navigator.clipboard.writeText(url);
              toast.success("Скопировано!");
            }}
          >
            <Clipboard className="size-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Method</Label>
        <Select
          value={values.method}
          onValueChange={(v) =>
            setValue("method", v as WebhookConfigInput["method"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Secret</Label>
        <Input
          placeholder="Опционально — для верификации подписи"
          {...register("secret")}
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
