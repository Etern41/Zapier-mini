import { Worker } from "bullmq";
import Redis from "ioredis";
import { runWorkflow } from "@/lib/executor";

export type WorkflowJobData = {
  workflowId: string;
  triggerData: Record<string, unknown>;
  trigger: string;
  runId?: string;
};

export function createWorkflowWorker(connection: Redis): Worker {
  return new Worker<WorkflowJobData>(
    "workflow-runs",
    async (job) => {
      const { workflowId, triggerData, trigger, runId } = job.data;
      await runWorkflow(workflowId, triggerData, trigger, {
        existingRunId: runId,
      });
    },
    { connection }
  );
}
