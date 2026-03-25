"use client";

import { StepLogRow } from "@/components/runs/StepLogRow";

export type StepLog = {
  id: string;
  nodeLabel: string;
  status: string;
  duration?: number | null;
  error?: string | null;
  input?: unknown;
  output?: unknown;
};

export function RunLogPanel({ steps }: { steps: StepLog[] }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
        Шаги
      </p>
      {steps.map((s) => (
        <StepLogRow
          key={s.id}
          label={s.nodeLabel}
          status={s.status}
          duration={s.duration}
          error={s.error}
          input={s.input}
          output={s.output}
        />
      ))}
    </div>
  );
}
