"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/analytics/StatsCards";
import { RunsLineChart } from "@/components/analytics/RunsLineChart";
import { WorkflowBarChart } from "@/components/analytics/WorkflowBarChart";
import { FailuresTable } from "@/components/analytics/FailuresTable";
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

  useEffect(() => {
    void fetch("/api/analytics")
      .then((r) => r.json())
      .then((d: AnalyticsPayload) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Не удалось загрузить аналитику
      </div>
    );
  }

  const hasRuns =
    data.runsByDay.some((d) => d.count > 0) ||
    data.runsByWorkflow.some((w) => w.count > 0);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Аналитика</h1>
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
            Пока нет данных для графиков — запустите воркфлоу
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
