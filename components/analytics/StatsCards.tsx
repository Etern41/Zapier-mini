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
      <Card className="rounded-lg border border-border bg-card p-4 shadow-card-zapier">
        <p className="text-[28px] font-bold leading-tight text-foreground">
          {totalWorkflows}
        </p>
        <p className="text-xs text-muted-foreground">Всего воркфлоу</p>
      </Card>
      <Card className="rounded-lg border border-border bg-card p-4 shadow-card-zapier">
        <div className="flex items-center gap-2">
          <p className="text-[28px] font-bold leading-tight text-foreground">
            {activeWorkflows}
          </p>
          <span className="size-2 rounded-full bg-success" />
        </div>
        <p className="text-xs text-muted-foreground">Активные воркфлоу</p>
      </Card>
      <Card className="rounded-lg border border-border bg-card p-4 shadow-card-zapier">
        <div className="flex items-center gap-2">
          <p className="text-[28px] font-bold leading-tight text-foreground">
            {runsToday}
          </p>
          <Clock className="size-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">Запусков сегодня</p>
      </Card>
      <Card className="rounded-lg border border-border bg-card p-4 shadow-card-zapier">
        <p className="text-[28px] font-bold leading-tight text-foreground">
          {successRate}%
        </p>
        <Progress value={successRate} className="mt-2 h-2" />
        <p className="mt-1 text-xs text-muted-foreground">Общая успешность</p>
      </Card>
    </div>
  );
}
