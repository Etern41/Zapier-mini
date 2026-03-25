"use client";

import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function StatsCards({
  totalWorkflows,
  activeWorkflows,
  runsToday,
  successRate,
}: {
  totalWorkflows: number;
  activeWorkflows: number;
  runsToday: number;
  successRate: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="rounded-xl border bg-card p-4">
        <p className="text-2xl font-semibold">{totalWorkflows}</p>
        <p className="text-sm text-muted-foreground">workflows</p>
      </Card>
      <Card className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold">{activeWorkflows}</p>
          <span className="size-2 rounded-full bg-success" />
        </div>
        <p className="text-sm text-muted-foreground">Active</p>
      </Card>
      <Card className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold">{runsToday}</p>
          <Clock className="size-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Runs Today</p>
      </Card>
      <Card className="rounded-xl border bg-card p-4">
        <p className="text-2xl font-semibold">{successRate}%</p>
        <Progress value={successRate} className="mt-2 h-2" />
        <p className="mt-1 text-sm text-muted-foreground">Success Rate</p>
      </Card>
    </div>
  );
}
