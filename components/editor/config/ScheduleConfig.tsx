"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  scheduleConfigSchema,
  type ScheduleConfigInput,
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

function looksLikeCron(s: string): boolean {
  const p = s.trim().split(/\s+/);
  return p.length >= 5;
}

function exprFor(
  f: ScheduleConfigInput["frequency"],
  custom?: string
): string | null {
  if (f === "custom")
    return custom?.trim() && looksLikeCron(custom) ? custom : null;
  switch (f) {
    case "every_minute":
      return "* * * * *";
    case "every_5_min":
      return "*/5 * * * *";
    case "every_hour":
      return "0 * * * *";
    case "daily":
      return "0 0 * * *";
    case "weekly":
      return "0 0 * * 0";
    default:
      return "0 0 * * *";
  }
}

export function ScheduleConfig({
  nodeId,
  initial,
  onSaved,
  workflowId,
}: {
  nodeId: string;
  initial: unknown;
  onSaved: () => void;
  workflowId?: string;
}) {
  const [lastRuns, setLastRuns] = useState<
    { startedAt: string; trigger: string }[]
  >([]);

  const parsedInit = scheduleConfigSchema.safeParse(initial ?? {});
  const defaults = parsedInit.success
    ? parsedInit.data
    : { frequency: "daily" as const, timezone: "UTC" as const };

  const form = useForm<ScheduleConfigInput>({
    resolver: zodResolver(scheduleConfigSchema),
    defaultValues: defaults,
  });

  const { watch, register, handleSubmit, setValue, formState } = form;
  const values = watch();
  const debounceKey = JSON.stringify(values);

  useEffect(() => {
    const t = setTimeout(() => {
      const cfg = safeDebouncedConfig(debounceKey, scheduleConfigSchema);
      if (!cfg) return;
      void patchNode(nodeId, { config: cfg }).then((ok) => {
        if (ok) onSaved();
      });
    }, 500);
    return () => clearTimeout(t);
  }, [debounceKey, nodeId, onSaved]);

  useEffect(() => {
    if (!workflowId) return;
    void fetch(`/api/workflows/${workflowId}/runs`)
      .then((r) => r.json())
      .then((d: { runs?: { startedAt: string; trigger: string }[] }) => {
        const list = (d.runs ?? [])
          .filter((x) => x.trigger === "schedule")
          .slice(0, 3);
        setLastRuns(list);
      })
      .catch(() => undefined);
  }, [workflowId]);

  const expr = exprFor(values.frequency, values.cronCustom);
  const saveNow = handleSubmit(async (data) => {
    await patchNode(nodeId, { config: data });
    onSaved();
  });

  return (
    <form className="space-y-4" onSubmit={(e) => void saveNow(e)}>
      <div className="space-y-2">
        <Label>Frequency</Label>
        <Select
          value={values.frequency}
          onValueChange={(v) =>
            setValue("frequency", v as ScheduleConfigInput["frequency"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="every_minute">Every minute</SelectItem>
            <SelectItem value="every_5_min">Every 5 min</SelectItem>
            <SelectItem value="every_hour">Every hour</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {values.frequency === "custom" ? (
        <div className="space-y-2">
          <Label>Cron выражение</Label>
          <Input placeholder="0 * * * *" {...register("cronCustom")} />
          <a
            href="https://crontab.guru"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary underline"
          >
            crontab.guru
          </a>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select
          value={values.timezone}
          onValueChange={(v) =>
            setValue("timezone", v as ScheduleConfigInput["timezone"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="Europe/Moscow">Europe/Moscow</SelectItem>
            <SelectItem value="Europe/Kiev">Europe/Kiev</SelectItem>
            <SelectItem value="America/New_York">America/New_York</SelectItem>
            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        Следующий запуск:{" "}
        {expr
          ? `cron ${expr} (${values.timezone})`
          : "укажите валидное cron"}
      </p>
      {lastRuns.length > 0 ? (
        <div>
          <Label className="text-muted-foreground">Last 3 runs</Label>
          <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
            {lastRuns.map((r) => (
              <li key={r.startedAt}>{r.startedAt}</li>
            ))}
          </ul>
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
