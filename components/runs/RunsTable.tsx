"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { RunLogPanel, type StepLog } from "@/components/runs/RunLogPanel";
import { cn } from "@/lib/utils";

export type RunRow = {
  id: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt?: string | null;
  error?: string | null;
  workflow?: { name: string };
  steps: StepLog[];
};

export function RunsTable({
  runs,
  showWorkflow,
}: {
  runs: RunRow[];
  showWorkflow?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div
        className={cn(
          "grid gap-2 border-b bg-muted/30 px-4 py-2 text-xs font-medium uppercase text-muted-foreground",
          showWorkflow
            ? "grid-cols-[1fr_1fr_1fr_auto]"
            : "grid-cols-[1fr_1fr_auto]"
        )}
      >
        {showWorkflow ? <span>Workflow</span> : null}
        <span>Запуск</span>
        <span>Статус</span>
        <span>Триггер</span>
      </div>
      {runs.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Нет запусков
        </p>
      ) : (
        runs.map((r) => (
          <div key={r.id} className="border-b border-border last:border-0">
            <button
              type="button"
              className="grid w-full gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              style={{
                gridTemplateColumns: showWorkflow
                  ? "1fr 1fr 1fr auto"
                  : "1fr 1fr auto",
              }}
              onClick={() => setOpen(open === r.id ? null : r.id)}
            >
              {showWorkflow ? (
                <span className="truncate text-sm font-medium">
                  {r.workflow?.name ?? "—"}
                </span>
              ) : null}
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(r.startedAt), {
                  addSuffix: true,
                  locale: ru,
                })}
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  "w-fit",
                  r.status === "SUCCESS" && "bg-success/15 text-success",
                  r.status === "FAILED" && "bg-destructive/15 text-destructive"
                )}
              >
                {r.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {r.trigger}
              </span>
            </button>
            {open === r.id ? (
              <div className="space-y-2 border-t border-border bg-background px-4 py-3">
                {r.error ? (
                  <p className="text-sm text-destructive">{r.error}</p>
                ) : null}
                <RunLogPanel steps={r.steps} />
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
