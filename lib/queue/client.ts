import { Queue } from "bullmq";
import Redis from "ioredis";

let queue: Queue | null = null;
let connection: Redis | null = null;

function getConnection(): Redis {
  const url = process.env.UPSTASH_REDIS_URL;
  if (!url) {
    throw new Error("UPSTASH_REDIS_URL is not set");
  }
  if (!connection) {
    connection = new Redis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function getWorkflowQueue(): Queue {
  if (!queue) {
    queue = new Queue("workflow-runs", {
      connection: getConnection(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });
  }
  return queue;
}

export async function enqueueWorkflowRun(payload: {
  workflowId: string;
  triggerData: Record<string, unknown>;
  trigger: string;
  runId?: string;
}): Promise<string> {
  const q = getWorkflowQueue();
  const job = await q.add("run", payload, {
    attempts: 1,
  });
  return job.id ?? "";
}
