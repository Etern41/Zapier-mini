"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LIMITS,
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

  const opHint: Record<TransformConfigInput["operation"], string> = {
    parse_json: "Текст JSON превращается в данные. Допускаются подстановки {{id.поле}}.",
    extract_field: "Одно поле из объекта по пути (например data.user.email).",
    map_array: "Для каждого элемента массива — выражение с item.",
    filter_array: "Оставляет элементы, для которых условие выполняется.",
    format_date: "Дата из входа в нужном виде (например dd.MM.yyyy HH:mm).",
    math: "Числа из подстановок и простое выражение.",
  };

  return (
    <form className="space-y-4" onSubmit={(e) => void saveNow(e)}>
      <Alert>
        <AlertDescription className="text-xs text-muted-foreground">
          Выполняется после предыдущих шагов. В «Вход» — JSON, текст или{" "}
          <code className="rounded bg-muted px-1">{"{{id_узла.поле}}"}</code>.
          Предпросмотр без данных реального запуска.
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>Операция</Label>
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
            <SelectItem value="parse_json">Разобрать JSON</SelectItem>
            <SelectItem value="extract_field">Извлечь поле</SelectItem>
            <SelectItem value="map_array">Преобразовать массив (map)</SelectItem>
            <SelectItem value="filter_array">Отфильтровать массив</SelectItem>
            <SelectItem value="format_date">Формат даты</SelectItem>
            <SelectItem value="math">Выражение (числа)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{opHint[op]}</p>
      </div>
      <div className="space-y-2">
        <Label>Вход (строка или шаблон)</Label>
        <Textarea
          placeholder="{{предыдущий_шаг.поле}}"
          rows={4}
          maxLength={LIMITS.transformInput}
          {...register("input")}
        />
      </div>
      {op === "extract_field" ? (
        <div className="space-y-2">
          <Label>Путь к полю</Label>
          <Input
            placeholder="data.user.email"
            maxLength={LIMITS.transformExpr}
            {...register("fieldPath")}
          />
        </div>
      ) : null}
      {op === "map_array" ? (
        <div className="space-y-2">
          <Label>Выражение</Label>
          <Input
            placeholder="item.name"
            maxLength={LIMITS.transformExpr}
            {...register("mapExpr")}
          />
        </div>
      ) : null}
      {op === "filter_array" ? (
        <div className="space-y-2">
          <Label>Условие</Label>
          <Input
            placeholder="item.active === true"
            maxLength={LIMITS.transformExpr}
            {...register("filterExpr")}
          />
        </div>
      ) : null}
      {op === "format_date" ? (
        <div className="space-y-2">
          <Label>Формат</Label>
          <Input
            placeholder="dd.MM.yyyy HH:mm"
            maxLength={LIMITS.transformExpr}
            {...register("dateFormat")}
          />
        </div>
      ) : null}
      {op === "math" ? (
        <div className="space-y-2">
          <Label>Выражение</Label>
          <Input
            placeholder="{{value}} * 100 / {{total}}"
            maxLength={LIMITS.transformExpr}
            {...register("mathExpr")}
          />
        </div>
      ) : null}
      <div>
        <Label className="text-muted-foreground">Предпросмотр</Label>
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
