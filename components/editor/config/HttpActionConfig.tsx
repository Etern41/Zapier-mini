"use client";

import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  httpActionConfigSchema,
  type HttpActionConfigInput,
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

export function HttpActionConfig({
  nodeId,
  initial,
  onSaved,
}: {
  nodeId: string;
  initial: unknown;
  onSaved: () => void;
}) {
  const parsedInit = httpActionConfigSchema.safeParse(initial ?? {});
  const defaults = parsedInit.success
    ? parsedInit.data
    : {
        method: "GET" as const,
        url: "https://example.com",
        headers: [],
        body: "",
        authType: "none" as const,
        authValue: "",
      };

  const form = useForm<HttpActionConfigInput>({
    resolver: zodResolver(httpActionConfigSchema),
    defaultValues: defaults,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "headers",
  });

  const { watch, register, handleSubmit, setValue, formState } = form;
  const values = watch();
  const debounceKey = JSON.stringify(values);

  useEffect(() => {
    const t = setTimeout(() => {
      const cfg = safeDebouncedConfig(debounceKey, httpActionConfigSchema);
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

  const showBody =
    values.method === "POST" ||
    values.method === "PUT" ||
    values.method === "PATCH";

  return (
    <form className="space-y-4" onSubmit={(e) => void saveNow(e)}>
      <Alert>
        <AlertDescription className="text-xs">
          Используйте {"{{nodeId.field}}"} для данных из предыдущих шагов
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>Method</Label>
        <Select
          value={values.method}
          onValueChange={(v) =>
            setValue("method", v as HttpActionConfigInput["method"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          placeholder="https://api.example.com/endpoint"
          {...register("url")}
        />
      </div>
      <div className="space-y-2">
        <Label>Headers</Label>
        {fields.map((f, i) => (
          <div key={f.id} className="flex gap-2">
            <Input placeholder="key" {...register(`headers.${i}.key`)} />
            <Input placeholder="value" {...register(`headers.${i}.value`)} />
            <Button type="button" variant="outline" onClick={() => remove(i)}>
              ×
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ key: "", value: "" })}
        >
          + Добавить заголовок
        </Button>
      </div>
      {showBody ? (
        <div className="space-y-2">
          <Label>Body</Label>
          <Textarea
            className="font-mono text-xs"
            placeholder='{"key": "value"}'
            rows={6}
            {...register("body")}
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label>Auth</Label>
        <Select
          value={values.authType}
          onValueChange={(v) =>
            setValue("authType", v as HttpActionConfigInput["authType"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Нет</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {values.authType !== "none" ? (
        <div className="space-y-2">
          <Label>Auth value</Label>
          <Input type="password" {...register("authValue")} />
        </div>
      ) : null}
      {Object.keys(formState.errors).length > 0 ? (
        <p className="text-xs text-destructive">Проверьте поля</p>
      ) : null}
      <Button type="submit" className="w-full">
        Сохранить
      </Button>
    </form>
  );
}
