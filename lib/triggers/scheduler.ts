import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import type { WorkflowNode } from "@prisma/client";
import { enqueueWorkflowRun } from "@/lib/queue/client";

export type ScheduleFrequency =
  | "every_minute"
  | "every_5_min"
  | "every_hour"
  | "daily"
  | "weekly"
  | "custom";

export function cronExpressionFromConfig(config: {
  frequency?: ScheduleFrequency;
  cronCustom?: string;
}): string | null {
  const f = config.frequency ?? "daily";
  if (f === "custom") {
    const c = config.cronCustom?.trim();
    return c && cron.validate(c) ? c : null;
  }
  switch (f) {
    case "every_minute":
      return "* * * * *";
    case "every_5_min":
      return "*/5 * * * *";
    case "every_hour":
      return "0 * * * *";
    case "daily":
      return "0 0 * * *";
    case "weekly":
      return "0 0 * * 0";
    default:
      return "0 0 * * *";
  }
}

const tasks = new Map<string, ScheduledTask>();

export function stopScheduleForWorkflow(workflowId: string): void {
  const t = tasks.get(workflowId);
  if (t) {
    t.stop();
    tasks.delete(workflowId);
  }
}

export function registerScheduleForWorkflow(
  workflowId: string,
  node: WorkflowNode
): void {
  stopScheduleForWorkflow(workflowId);
  const cfg = (node.config ?? {}) as {
    frequency?: ScheduleFrequency;
    cronCustom?: string;
    timezone?: string;
  };
  const expr = cronExpressionFromConfig(cfg);
  if (!expr) return;

  const timezone =
    typeof cfg.timezone === "string" && cfg.timezone.trim()
      ? cfg.timezone.trim()
      : "UTC";

  const task = cron.schedule(
    expr,
    async () => {
      try {
        await enqueueWorkflowRun({
          workflowId,
          triggerData: { scheduledAt: new Date().toISOString() },
          trigger: "schedule",
        });
      } catch {
        // queue may be unavailable
      }
    },
    { timezone }
  );
  task.start();

  tasks.set(workflowId, task);
}

export function syncScheduledWorkflows(
  items: Array<{ workflowId: string; node: WorkflowNode }>
): void {
  const ids = new Set(items.map((i) => i.workflowId));
  for (const id of Array.from(tasks.keys())) {
    if (!ids.has(id)) stopScheduleForWorkflow(id);
  }
  for (const { workflowId, node } of items) {
    registerScheduleForWorkflow(workflowId, node);
  }
}
