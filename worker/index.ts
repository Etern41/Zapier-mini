import Redis from "ioredis";
import { prisma } from "../lib/prisma";
import { createWorkflowWorker } from "../lib/queue/worker";
import {
  syncScheduledWorkflows,
  stopScheduleForWorkflow,
} from "../lib/triggers/scheduler";
import { pollAllEmailTriggers } from "../lib/triggers/emailPoller";

const url = process.env.UPSTASH_REDIS_URL;
if (!url) {
  console.error("UPSTASH_REDIS_URL is required for the worker");
  process.exit(1);
}

const connection = new Redis(url, { maxRetriesPerRequest: null });

const worker = createWorkflowWorker(connection);

worker.on("failed", (job, err) => {
  console.error("Job failed", job?.id, err);
});

async function loadScheduleEntries() {
  const workflows = await prisma.workflow.findMany({
    where: { isActive: true },
    include: { nodes: { orderBy: { order: "asc" } } },
  });
  const entries: Array<{ workflowId: string; node: (typeof workflows)[0]["nodes"][0] }> =
    [];
  for (const w of workflows) {
    const sched = w.nodes.find((n) => n.type === "TRIGGER_SCHEDULE");
    if (sched) entries.push({ workflowId: w.id, node: sched });
    else stopScheduleForWorkflow(w.id);
  }
  syncScheduledWorkflows(entries);
  return entries;
}

async function loadEmailEntries() {
  const workflows = await prisma.workflow.findMany({
    where: { isActive: true },
    include: { nodes: { orderBy: { order: "asc" } } },
  });
  const entries: Array<{ workflowId: string; node: (typeof workflows)[0]["nodes"][0] }> =
    [];
  for (const w of workflows) {
    const emailNode = w.nodes.find((n) => n.type === "TRIGGER_EMAIL");
    if (emailNode) entries.push({ workflowId: w.id, node: emailNode });
  }
  return entries;
}

async function syncLoop() {
  try {
    await loadScheduleEntries();
  } catch (e) {
    console.error("Schedule sync error", e);
  }
}

async function emailLoop() {
  try {
    const entries = await loadEmailEntries();
    await pollAllEmailTriggers(entries);
  } catch (e) {
    console.error("Email poll error", e);
  }
}

void syncLoop();
setInterval(syncLoop, 60_000);

void emailLoop();
setInterval(emailLoop, 5 * 60_000);

console.log("AutoFlow worker started (BullMQ + schedules + email poll)");
