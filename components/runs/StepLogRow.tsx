"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StepLogRow({
  label,
  status,
  duration,
  error,
}: {
  label: string;
  status: string;
  duration?: number | null;
  error?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border py-2 text-sm last:border-0">
      <span className="min-w-0 flex-1 font-medium text-foreground">
        {label}
      </span>
      <Badge
        variant="secondary"
        className={cn(
          status === "SUCCESS" && "bg-success/15 text-success",
          status === "FAILED" && "bg-destructive/15 text-destructive",
          status === "RUNNING" && "bg-muted"
        )}
      >
        {status}
      </Badge>
      {duration != null ? (
        <span className="text-xs tabular-nums text-muted-foreground">
          {duration}ms
        </span>
      ) : null}
      {error ? (
        <p className="w-full text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
