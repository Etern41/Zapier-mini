"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StatsCards } from "@/components/analytics/StatsCards";
import { RunsLineChart } from "@/components/analytics/RunsLineChart";
import { WorkflowBarChart } from "@/components/analytics/WorkflowBarChart";
import { FailuresTable } from "@/components/analytics/FailuresTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AnalyticsPayload = {
  totalWorkflows: number;
  activeWorkflows: number;
  runsToday: number;
  successRate: number;
  runsByDay: { date: string; count: number }[];
  runsByWorkflow: { id: string; name: string; count: number }[];
  recentFailures: {
    id: string;
    workflowId: string;
    workflowName: string;
    error: string | null;
    startedAt: string;
  }[];
};

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-40 rounded-lg" />
    </div>
  );
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics");
      const j = (await res.json().catch(() => ({}))) as
        | AnalyticsPayload
        | { error?: string };
      if (!res.ok) {
        const msg =
          "error" in j && j.error
            ? j.error
            : "Не удалось загрузить аналитику";
        setError(msg);
        setData(null);
        toast.error(msg);
        return;
      }
      setData(j as AnalyticsPayload);
    } catch {
      const msg = "Сеть недоступна. Проверьте подключение.";
      setError(msg);
      setData(null);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="space-y-6">
        <h1 className="sr-only">Аналитика</h1>
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {error ?? "Не удалось загрузить аналитику"}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6"
            onClick={() => void load()}
          >
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  const hasRuns =
    data.runsByDay.some((d) => d.count > 0) ||
    data.runsByWorkflow.some((w) => w.count > 0);

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Аналитика</h1>
      <StatsCards
        totalWorkflows={data.totalWorkflows}
        activeWorkflows={data.activeWorkflows}
        runsToday={data.runsToday}
        successRate={data.successRate}
      />
      {!hasRuns ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center shadow-card-zapier">
          <svg
            className="mx-auto h-16 w-16 text-muted-foreground/30"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden
          >
            <path
              d="M8 48 L24 32 L36 40 L56 20"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <p className="mt-4 text-sm text-muted-foreground">
            Нет данных за выбранный период. Опубликуйте Zap и запустите его,
            чтобы увидеть статистику.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <RunsLineChart data={data.runsByDay} />
          <WorkflowBarChart
            data={data.runsByWorkflow.map((w) => ({
              name: w.name,
              count: w.count,
            }))}
          />
        </div>
      )}
      <FailuresTable rows={data.recentFailures} />
    </div>
  );
}
