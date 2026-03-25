"use client";

import { CheckCircle2, CircleDashed, Loader2, MinusCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { stepStatusLabelRu } from "@/lib/run-labels";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "SUCCESS":
      return (
        <CheckCircle2
          className="size-4 shrink-0 text-success"
          aria-hidden
        />
      );
    case "FAILED":
      return (
        <XCircle className="size-4 shrink-0 text-destructive" aria-hidden />
      );
    case "SKIPPED":
      return (
        <MinusCircle
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      );
    case "RUNNING":
      return (
        <Loader2
          className="size-4 shrink-0 animate-spin text-primary"
          aria-hidden
        />
      );
    default:
      return (
        <CircleDashed
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      );
  }
}

function jsonBlock(label: string, value: unknown) {
  if (value === undefined || value === null) return null;
  const text =
    typeof value === "string"
      ? value
      : JSON.stringify(value, null, 2);
  return (
    <details className="mt-1 w-full rounded border border-border/80 bg-background/80">
      <summary className="cursor-pointer select-none px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/50">
        {label}
      </summary>
      <pre className="max-h-40 overflow-auto border-t border-border p-2 font-mono text-[11px] leading-relaxed text-foreground">
        {text}
      </pre>
    </details>
  );
}

export function StepLogRow({
  label,
  status,
  duration,
  error,
  input,
  output,
}: {
  label: string;
  status: string;
  duration?: number | null;
  error?: string | null;
  input?: unknown;
  output?: unknown;
}) {
  return (
    <div className="border-b border-border py-2 text-sm last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <StatusIcon status={status} />
        <span className="min-w-0 flex-1 font-medium text-foreground">
          {label}
        </span>
        <Badge
          variant="secondary"
          className={cn(
            "inline-flex items-center gap-1.5",
            status === "SUCCESS" && "bg-success/15 text-success",
            (status === "FAILED" || status === "ERROR") &&
              "bg-destructive/15 text-destructive",
            status === "RUNNING" && "bg-primary/15 text-primary",
            status === "PENDING" && "bg-muted text-muted-foreground",
            status === "SKIPPED" && "bg-muted text-muted-foreground"
          )}
        >
          {status === "RUNNING" ? (
            <span
              className="size-1.5 shrink-0 animate-pulse rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
          {stepStatusLabelRu(status)}
        </Badge>
        {duration != null ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {duration} мс
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1 pl-6 text-xs text-destructive">{error}</p>
      ) : null}
      <div className="mt-1 pl-6">
        {jsonBlock("Вход (JSON)", input)}
        {jsonBlock("Выход (JSON)", output)}
      </div>
    </div>
  );
}
