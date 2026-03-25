"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transformConfigSchema,
  type TransformConfigInput,
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
import { runTransformStepSync } from "@/lib/executor/steps/transform";

export function TransformConfig({
  nodeId,
  initial,
  onSaved,
}: {
  nodeId: string;
  initial: unknown;
  onSaved: () => void;
}) {
  const parsedInit = transformConfigSchema.safeParse(initial ?? {});
  const defaults = parsedInit.success
    ? parsedInit.data
    : {
        operation: "parse_json" as const,
        input: "",
        fieldPath: "",
        mapExpr: "",
        filterExpr: "",
        dateFormat: "",
        mathExpr: "",
      };

  const form = useForm<TransformConfigInput>({
    resolver: zodResolver(transformConfigSchema),
    defaultValues: defaults,
  });

  const { watch, register, handleSubmit, setValue, formState } = form;
  const values = watch();
  const debounceKey = JSON.stringify(values);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => {
      const cfg = safeDebouncedConfig(debounceKey, transformConfigSchema);
      if (!cfg) return;
      void patchNode(nodeId, { config: cfg });
    }, 500);
    return () => clearTimeout(t);
  }, [debounceKey, nodeId]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const cfg = safeDebouncedConfig(debounceKey, transformConfigSchema);
        if (!cfg) {
          setPreview("—");
          return;
        }
        const out = runTransformStepSync(cfg as Record<string, unknown>);
        setPreview(
          typeof out === "string" ? out : JSON.stringify(out, null, 2)
        );
      } catch (e) {
        setPreview(e instanceof Error ? e.message : "Error");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [debounceKey]);

  const saveNow = handleSubmit(async (data) => {
    const ok = await patchNode(nodeId, { config: data });
    if (!ok) {
      toast.error("Не удалось сохранить настройки");
      return;
    }
    onSaved();
  });

  const op: TransformConfigInput["operation"] = values.operation;

  return (
    <form className="space-y-4" onSubmit={(e) => void saveNow(e)}>
      <Alert>
        <AlertDescription className="text-xs">
          Используйте {"{{предыдущий_шаг.поле}}"} в Input для подстановки
          (клиентский предпросмотр без контекста).
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>Operation</Label>
        <Select
          value={values.operation}
          onValueChange={(v) =>
            setValue("operation", v as TransformConfigInput["operation"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parse_json">Parse JSON</SelectItem>
            <SelectItem value="extract_field">Extract Field</SelectItem>
            <SelectItem value="map_array">Map Array</SelectItem>
            <SelectItem value="filter_array">Filter Array</SelectItem>
            <SelectItem value="format_date">Format Date</SelectItem>
            <SelectItem value="math">Math</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Input</Label>
        <Textarea
          placeholder="{{предыдущий_шаг.поле}}"
          rows={4}
          {...register("input")}
        />
      </div>
      {op === "extract_field" ? (
        <div className="space-y-2">
          <Label>Путь к полю</Label>
          <Input placeholder="data.user.email" {...register("fieldPath")} />
        </div>
      ) : null}
      {op === "map_array" ? (
        <div className="space-y-2">
          <Label>Выражение</Label>
          <Input placeholder="item.name" {...register("mapExpr")} />
        </div>
      ) : null}
      {op === "filter_array" ? (
        <div className="space-y-2">
          <Label>Условие</Label>
          <Input
            placeholder="item.active === true"
            {...register("filterExpr")}
          />
        </div>
      ) : null}
      {op === "format_date" ? (
        <div className="space-y-2">
          <Label>Формат</Label>
          <Input placeholder="dd.MM.yyyy HH:mm" {...register("dateFormat")} />
        </div>
      ) : null}
      {op === "math" ? (
        <div className="space-y-2">
          <Label>Выражение</Label>
          <Input
            placeholder="{{value}} * 100 / {{total}}"
            {...register("mathExpr")}
          />
        </div>
      ) : null}
      <div>
        <Label className="text-muted-foreground">Output preview</Label>
        <div className="mt-1 rounded-md bg-muted p-2 font-mono text-xs">
          {preview || "—"}
        </div>
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
