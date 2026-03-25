"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { StatsCards } from "@/components/analytics/StatsCards";
import { RunsLineChart } from "@/components/analytics/RunsLineChart";
import { WorkflowBarChart } from "@/components/analytics/WorkflowBarChart";
import { FailuresTable } from "@/components/analytics/FailuresTable";

type AnalyticsPayload = {
  totalWorkflows: number;
  activeWorkflows: number;
  runsToday: number;
  successRate: number;
  runsByDay: { date: string; count: number }[];
  runsByWorkflow: { id: string; name: string; count: number }[];
  recentFailures: {
    id: string;
    workflowName: string;
    error: string | null;
    startedAt: string;
  }[];
};

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  useEffect(() => {
    void fetch("/api/analytics")
      .then((r) => r.json())
      .then((d: AnalyticsPayload) => setData(d))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Аналитика</h1>
      <StatsCards
        totalWorkflows={data.totalWorkflows}
        activeWorkflows={data.activeWorkflows}
        runsToday={data.runsToday}
        successRate={data.successRate}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RunsLineChart data={data.runsByDay} />
        <WorkflowBarChart
          data={data.runsByWorkflow.map((w) => ({
            name: w.name,
            count: w.count,
          }))}
        />
      </div>
      <FailuresTable rows={data.recentFailures} />
    </div>
  );
}
