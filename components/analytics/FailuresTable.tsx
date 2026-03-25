"use client";

import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function FailuresTable({
  rows,
}: {
  rows: {
    id: string;
    workflowName: string;
    error: string | null;
    startedAt: string;
  }[];
}) {
  return (
    <Card className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-sm font-medium">Последние ошибки</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ошибок нет</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-border bg-muted/20 p-3 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-foreground">
                  {r.workflowName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.startedAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
              <p className="mt-1 text-xs text-destructive">
                {r.error ?? "Unknown error"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
