"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RunLogPanel, type StepLog } from "@/components/runs/RunLogPanel";
import {
  formatRunDuration,
  runStatusLabelRu,
  triggerLabelRu,
} from "@/lib/run-labels";
import { cn } from "@/lib/utils";

export type RunRow = {
  id: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt?: string | null;
  error?: string | null;
  workflow?: { id?: string; name: string };
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

  const failedStepId = useMemo(() => {
    const m = new Map<string, string | undefined>();
    for (const r of runs) {
      const failed = r.steps.find((s) => s.status === "FAILED");
      m.set(r.id, failed?.nodeLabel);
    }
    return m;
  }, [runs]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card-zapier">
      <div
        className={cn(
          "grid gap-2 border-b border-border bg-muted/40 px-4 py-3 text-left",
          showWorkflow
            ? "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.5fr)_minmax(0,0.6fr)_minmax(0,0.7fr)_auto]"
            : "grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)_minmax(0,0.6fr)_minmax(0,0.7fr)_auto]"
        )}
      >
        {showWorkflow ? (
          <span className="section-label font-medium">Воркфлоу</span>
        ) : null}
        <span className="section-label font-medium">Запущен</span>
        <span className="section-label font-medium">Длительность</span>
        <span className="section-label font-medium">Статус</span>
        <span className="section-label font-medium">Триггер</span>
        <span className="section-label text-right font-medium">Действия</span>
      </div>
      {runs.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <svg
            className="mx-auto h-20 w-20 text-muted-foreground/30"
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden
          >
            <rect
              x="12"
              y="20"
              width="56"
              height="40"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M20 32h40M20 44h24" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p className="mt-4 text-sm text-muted-foreground">Нет запусков</p>
        </div>
      ) : (
        runs.map((r) => {
          const dur = formatRunDuration(
            r.startedAt,
            r.finishedAt,
            r.status
          );
          return (
            <div key={r.id} className="border-b border-border last:border-0">
              <div
                className={cn(
                  "grid items-center gap-2 px-4 py-3",
                  showWorkflow
                    ? "grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.5fr)_minmax(0,0.6fr)_minmax(0,0.7fr)_auto]"
                    : "grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)_minmax(0,0.6fr)_minmax(0,0.7fr)_auto]"
                )}
              >
                {showWorkflow ? (
                  <div className="min-w-0">
                    {r.workflow?.id ? (
                      <Link
                        href={`/workflows/${r.workflow.id}/runs`}
                        className="flex min-w-0 items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline"
                      >
                        <span className="text-[#FF4A00]" aria-hidden>
                          ⚡
                        </span>
                        <span className="truncate">
                          {r.workflow?.name ?? "—"}
                        </span>
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1.5 truncate font-medium">
                        <span className="text-[#FF4A00]" aria-hidden>
                          ⚡
                        </span>
                        {r.workflow?.name ?? "—"}
                      </span>
                    )}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground">
                  <div>
                    {format(new Date(r.startedAt), "dd.MM.yyyy HH:mm", {
                      locale: ru,
                    })}
                  </div>
                  <div className="text-[11px]">
                    {formatDistanceToNow(new Date(r.startedAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </div>
                </div>
                <div className="tabular-nums text-sm text-foreground">{dur}</div>
                <div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "w-fit text-xs font-normal",
                      r.status === "SUCCESS" && "bg-success/15 text-success",
                      r.status === "FAILED" && "bg-destructive/15 text-destructive",
                      r.status === "RUNNING" && "bg-primary/15 text-primary"
                    )}
                  >
                    {runStatusLabelRu(r.status)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {triggerLabelRu(r.trigger)}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setOpen(open === r.id ? null : r.id)}
                  >
                    Подробнее
                  </Button>
                </div>
              </div>
              {open === r.id ? (
                <div className="space-y-2 border-t border-border bg-muted/20 px-4 py-3">
                  {r.error ? (
                    <p className="text-sm text-destructive">
                      {r.error}
                      {failedStepId.get(r.id) ? (
                        <span className="block text-xs text-muted-foreground">
                          Сбой на шаге: {failedStepId.get(r.id)}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  <RunLogPanel steps={r.steps} />
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
