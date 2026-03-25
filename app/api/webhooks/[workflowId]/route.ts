import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueWorkflowRun } from "@/lib/queue/client";
import { WEBHOOK_HEADER_SECRET } from "@/lib/triggers/webhook";

type Ctx = { params: Promise<{ workflowId: string }> };

async function parseTriggerData(req: Request): Promise<Record<string, unknown>> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const j = await req.json();
      return typeof j === "object" && j !== null && !Array.isArray(j)
        ? (j as Record<string, unknown>)
        : { data: j };
    } catch {
      return {};
    }
  }
  if (
    ct.includes("application/x-www-form-urlencoded") ||
    ct.includes("multipart/form-data")
  ) {
    const fd = await req.formData();
    const o: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      o[k] = typeof v === "string" ? v : String(v);
    });
    return o;
  }
  const text = await req.text().catch(() => "");
  if (text) {
    try {
      const j = JSON.parse(text) as unknown;
      return typeof j === "object" && j !== null && !Array.isArray(j)
        ? (j as Record<string, unknown>)
        : { body: j };
    } catch {
      return { raw: text };
    }
  }
  return {};
}

async function handleWebhook(
  req: Request,
  workflowId: string,
  triggerData: Record<string, unknown>
) {
  const wf = await prisma.workflow.findFirst({
    where: { id: workflowId, isActive: true },
  });

  if (!wf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (wf.webhookSecret) {
    const h = req.headers.get(WEBHOOK_HEADER_SECRET);
    if (h !== wf.webhookSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const run = await prisma.workflowRun.create({
    data: {
      workflowId,
      status: "RUNNING",
      trigger: "webhook",
    },
  });

  try {
    await enqueueWorkflowRun({
      workflowId,
      triggerData,
      trigger: "webhook",
      runId: run.id,
    });
    return NextResponse.json({
      received: true,
      runId: run.id,
    });
  } catch {
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        error: "Queue unavailable",
        finishedAt: new Date(),
      },
    });
    return NextResponse.json(
      { error: "Queue unavailable" },
      { status: 503 }
    );
  }
}

export async function GET(req: Request, ctx: Ctx) {
  const { workflowId } = await ctx.params;
  const url = new URL(req.url);
  const triggerData: Record<string, unknown> = Object.fromEntries(
    url.searchParams.entries()
  );
  return handleWebhook(req, workflowId, triggerData);
}

export async function POST(req: Request, ctx: Ctx) {
  const { workflowId } = await ctx.params;
  const triggerData = await parseTriggerData(req);
  return handleWebhook(req, workflowId, triggerData);
}
