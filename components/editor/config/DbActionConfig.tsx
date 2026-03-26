"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LIMITS,
  dbActionConfigSchema,
  type DbActionConfigInput,
} from "@/lib/validations";
import { AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { safeDebouncedConfig } from "@/lib/editor/debounced-config";
import { patchNode } from "@/lib/editor/patch-node";

export function DbActionConfig({
  nodeId,
  initial,
  onSaved,
}: {
  nodeId: string;
  initial: unknown;
  onSaved: () => void;
}) {
  const parsedInit = dbActionConfigSchema.safeParse(initial ?? {});
  const defaults = parsedInit.success
    ? parsedInit.data
    : { operation: "SELECT" as const, table: "", query: "" };

  const form = useForm<DbActionConfigInput>({
    resolver: zodResolver(dbActionConfigSchema),
    defaultValues: defaults,
  });

  const { watch, register, handleSubmit, setValue, formState } = form;
  const values = watch();
  const debounceKey = JSON.stringify(values);

  useEffect(() => {
    const t = setTimeout(() => {
      const cfg = safeDebouncedConfig(debounceKey, dbActionConfigSchema);
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
      <Alert className="border-warning/40 bg-warning/10">
        <AlertTriangle className="size-4 text-warning" />
        <AlertTitle className="text-warning-foreground">Внимание</AlertTitle>
        <AlertDescription className="text-xs text-warning-foreground">
          Запрос идёт в ту же базу, что и у приложения. Изменения и удаления
          необратимы — проверьте SQL отдельно.
        </AlertDescription>
      </Alert>
      <Alert>
        <AlertDescription className="text-xs text-muted-foreground">
          Подстановки:{" "}
          <code className="rounded bg-muted px-1">{"{{id_узла.поле}}"}</code>.
          Имена таблиц как в схеме БД (часто вроде{" "}
          <code className="rounded bg-muted px-1">workflow_run</code>).
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label>Операция</Label>
        <Select
          value={values.operation}
          onValueChange={(v) =>
            setValue("operation", v as DbActionConfigInput["operation"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SELECT">SELECT</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Таблица (для справки / валидации)</Label>
        <Input
          placeholder="workflow_run"
          maxLength={LIMITS.dbTable}
          {...register("table")}
        />
      </div>
      <div className="space-y-2">
        <Label>SQL-запрос</Label>
        <Textarea
          className="font-mono text-xs"
          maxLength={LIMITS.dbQuery}
          rows={6}
          placeholder={"SELECT * FROM users WHERE id = '{{trigger.id}}'"}
          {...register("query")}
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
