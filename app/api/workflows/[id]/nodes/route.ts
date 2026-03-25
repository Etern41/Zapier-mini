import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { NodeType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/api-auth";
import { nodeCreateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;
  const { id } = await ctx.params;

  const wf = await prisma.workflow.findFirst({
    where: { id, userId: u.userId },
  });
  if (!wf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nodes = await prisma.workflowNode.findMany({
    where: { workflowId: id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ nodes });
}

export async function POST(req: Request, ctx: Ctx) {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;
  const { id } = await ctx.params;

  const wf = await prisma.workflow.findFirst({
    where: { id, userId: u.userId },
  });
  if (!wf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = nodeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  if (parsed.data.type === "TRIGGER_WEBHOOK") {
    const existing = await prisma.workflowNode.findFirst({
      where: { workflowId: id, type: "TRIGGER_WEBHOOK" },
    });
    if (!existing) {
      await prisma.workflow.update({
        where: { id },
        data: { webhookSecret: randomBytes(24).toString("hex") },
      });
    }
  }

  const node = await prisma.workflowNode.create({
    data: {
      workflowId: id,
      type: parsed.data.type as NodeType,
      label: parsed.data.label,
      positionX: parsed.data.positionX,
      positionY: parsed.data.positionY,
      order: parsed.data.order,
    },
  });

  return NextResponse.json({ node });
}
