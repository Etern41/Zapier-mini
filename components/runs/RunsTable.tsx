"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  workflowId: pageWorkflowId,
  footer,
}: {
  runs: RunRow[];
  showWorkflow?: boolean;
  /** When rows lack `workflow.id` (per-workflow history page), pass workflow id for «Повторить запуск». */
  workflowId?: string;
  footer?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [rerunBusy, setRerunBusy] = useState<string | null>(null);

  const rerunWorkflow = async (wfId: string, runId: string) => {
    setRerunBusy(runId);
    try {
      const res = await fetch(`/api/workflows/${wfId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(j.error ?? "Не удалось поставить запуск в очередь");
        return;
      }
      toast.success("Новый запуск поставлен в очередь");
      router.refresh();
    } finally {
      setRerunBusy(null);
    }
  };

  const failedStepId = useMemo(() => {
    const m = new Map<string, string | undefined>();
    for (const r of runs) {
      const failed = r.steps.find(
        (s) => s.status === "FAILED" || s.status === "ERROR"
      );
      m.set(r.id, failed?.nodeLabel);
    }
    return m;
  }, [runs]);

  const gridCols = showWorkflow
    ? "grid-cols-[minmax(10rem,1.15fr)_minmax(9.5rem,1fr)_minmax(4.5rem,0.42fr)_minmax(6.5rem,0.55fr)_minmax(5rem,0.5fr)_auto]"
    : "grid-cols-[minmax(9.5rem,1fr)_minmax(4.5rem,0.45fr)_minmax(6.5rem,0.55fr)_minmax(5rem,0.5fr)_auto]";

  const startedRel = (iso: string) =>
    formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ru });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card-zapier">
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
        <div className="overflow-x-auto">
          <div className={cn("min-w-[640px]", showWorkflow && "min-w-[720px]")}>
            <div
              className={cn(
                "grid gap-x-3 gap-y-1 border-b border-border bg-muted/40 px-4 py-3 text-left",
                gridCols
              )}
            >
              {showWorkflow ? (
                <span className="section-label whitespace-nowrap font-medium">
                  Воркфлоу
                </span>
              ) : null}
              <span className="section-label whitespace-nowrap font-medium">
                Запущен
              </span>
              <span className="section-label whitespace-nowrap font-medium">
                Длительность
              </span>
              <span className="section-label whitespace-nowrap font-medium">
                Статус
              </span>
              <span className="section-label whitespace-nowrap font-medium">
                Триггер
              </span>
              <span className="section-label whitespace-nowrap text-right font-medium">
                Действия
              </span>
            </div>
            {runs.map((r) => {
              const dur = formatRunDuration(
                r.startedAt,
                r.finishedAt,
                r.status
              );
              const rel = startedRel(r.startedAt);
              return (
                <div key={r.id} className="border-b border-border last:border-0">
                  <div
                    className={cn(
                      "grid items-center gap-x-3 gap-y-1 px-4 py-3",
                      gridCols
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
                    <div
                      className="min-w-0 text-muted-foreground"
                      title={`${format(new Date(r.startedAt), "dd.MM.yyyy HH:mm:ss", { locale: ru })} · ${rel}`}
                    >
                      <time
                        dateTime={r.startedAt}
                        className="block whitespace-nowrap text-xs tabular-nums tracking-tight text-foreground"
                      >
                        {format(new Date(r.startedAt), "dd.MM.yyyy HH:mm", {
                          locale: ru,
                        })}
                      </time>
                      <span className="block truncate text-[11px] leading-snug text-muted-foreground">
                        {rel}
                      </span>
                    </div>
                    <div className="whitespace-nowrap tabular-nums text-sm text-foreground">
                      {dur}
                    </div>
                    <div className="min-w-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "inline-flex w-fit max-w-full items-center gap-1.5 text-xs font-normal",
                          r.status === "SUCCESS" && "bg-success/15 text-success",
                          (r.status === "FAILED" || r.status === "ERROR") &&
                            "bg-destructive/15 text-destructive",
                          r.status === "RUNNING" && "bg-primary/15 text-primary",
                          r.status === "PENDING" &&
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {r.status === "RUNNING" ? (
                          <span
                            className="size-1.5 shrink-0 animate-pulse rounded-full bg-primary"
                            aria-hidden
                          />
                        ) : null}
                        {runStatusLabelRu(r.status)}
                      </Badge>
                    </div>
                    <div className="min-w-0 text-xs text-muted-foreground">
                      <span className="line-clamp-2 leading-snug">
                        {triggerLabelRu(r.trigger)}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 text-xs"
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
                      {(() => {
                        const wfId = r.workflow?.id ?? pageWorkflowId;
                        if (!wfId) return null;
                        return (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={rerunBusy === r.id}
                              onClick={() => void rerunWorkflow(wfId, r.id)}
                            >
                              {rerunBusy === r.id ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : null}
                              Повторить запуск
                            </Button>
                          </div>
                        );
                      })()}
                      <RunLogPanel steps={r.steps} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {footer}
    </div>
  );
}
