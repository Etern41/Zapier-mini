import type { NodeType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { interpolateObject } from "@/lib/interpolate";
import { notifyWorkflowFailure } from "@/lib/notifications";
import { runHttpStep } from "@/lib/executor/steps/http";
import { runEmailStep } from "@/lib/executor/steps/email";
import { runTelegramStep } from "@/lib/executor/steps/telegram";
import { runDbStep } from "@/lib/executor/steps/db";
import { runTransformStep } from "@/lib/executor/steps/transform";

function isTriggerType(t: NodeType): boolean {
  return (
    t === "TRIGGER_WEBHOOK" ||
    t === "TRIGGER_SCHEDULE" ||
    t === "TRIGGER_EMAIL"
  );
}

async function executeNode(
  type: NodeType,
  config: Record<string, unknown>
): Promise<unknown> {
  switch (type) {
    case "ACTION_HTTP":
      return runHttpStep(config);
    case "ACTION_EMAIL":
      return runEmailStep(config);
    case "ACTION_TELEGRAM":
      return runTelegramStep(config);
    case "ACTION_DB":
      return runDbStep(config);
    case "ACTION_TRANSFORM":
      return runTransformStep(config);
    default:
      throw new Error(`Unsupported node type for execution: ${type}`);
  }
}

export async function runWorkflow(
  workflowId: string,
  triggerData: Record<string, unknown>,
  trigger: string,
  options?: { existingRunId?: string }
): Promise<{ runId: string; success: boolean; error?: string }> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { nodes: { orderBy: { order: "asc" } } },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const nodes = workflow.nodes;
  let run: { id: string };
  if (options?.existingRunId) {
    const existing = await prisma.workflowRun.findFirst({
      where: { id: options.existingRunId, workflowId },
    });
    if (!existing) {
      throw new Error("Run not found");
    }
    run = { id: existing.id };
  } else {
    run = await prisma.workflowRun.create({
      data: {
        workflowId,
        status: "RUNNING",
        trigger,
      },
    });
  }

  if (nodes.length === 0) {
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        error: "No nodes",
        finishedAt: new Date(),
      },
    });
    return { runId: run.id, success: false, error: "No nodes" };
  }

  const triggerNode = nodes[0];
  if (!isTriggerType(triggerNode.type)) {
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        error: "First node must be a trigger",
        finishedAt: new Date(),
      },
    });
    return {
      runId: run.id,
      success: false,
      error: "First node must be a trigger",
    };
  }

  const context: Record<string, unknown> = {
    [triggerNode.id]: triggerData,
  };

  const actionNodes = nodes.slice(1);

  for (const node of actionNodes) {
    if (isTriggerType(node.type)) continue;

    const rawConfig = (node.config ?? {}) as Record<string, unknown>;
    const config = interpolateObject(rawConfig, context) as Record<
      string,
      unknown
    >;

    const stepLog = await prisma.stepLog.create({
      data: {
        runId: run.id,
        nodeId: node.id,
        nodeLabel: node.label,
        status: "RUNNING",
        input: JSON.parse(JSON.stringify(context)) as object,
        attempt: 1,
      },
    });

    const started = Date.now();
    let lastError = "";

    const tryRun = async (attempt: number) => {
      const t0 = Date.now();
      const out = await executeNode(node.type, config);
      const duration = Date.now() - t0;
      await prisma.stepLog.update({
        where: { id: stepLog.id },
        data: {
          status: "SUCCESS",
          output: out as object,
          duration,
          attempt,
        },
      });
      context[node.id] = out;
    };

    try {
      await tryRun(1);
    } catch (e1) {
      lastError = e1 instanceof Error ? e1.message : String(e1);
      await new Promise((r) => setTimeout(r, 2000));
      try {
        await tryRun(2);
      } catch (e2) {
        lastError = e2 instanceof Error ? e2.message : String(e2);
        await prisma.stepLog.update({
          where: { id: stepLog.id },
          data: {
            status: "FAILED",
            error: lastError.slice(0, 2000),
            duration: Date.now() - started,
            attempt: 2,
          },
        });
        await prisma.workflowRun.update({
          where: { id: run.id },
          data: {
            status: "FAILED",
            error: lastError.slice(0, 2000),
            finishedAt: new Date(),
          },
        });
        await notifyWorkflowFailure(workflowId, lastError);
        return { runId: run.id, success: false, error: lastError };
      }
    }
  }

  await prisma.workflowRun.update({
    where: { id: run.id },
    data: {
      status: "SUCCESS",
      finishedAt: new Date(),
    },
  });

  return { runId: run.id, success: true };
}
