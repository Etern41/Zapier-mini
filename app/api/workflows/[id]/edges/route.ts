import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/api-auth";
import { edgeCreateSchema, edgeDeleteSchema } from "@/lib/validations";

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

  const edges = await prisma.workflowEdge.findMany({
    where: { workflowId: id },
  });

  return NextResponse.json({ edges });
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

  const parsed = edgeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const edge = await prisma.workflowEdge.create({
    data: {
      workflowId: id,
      sourceId: parsed.data.sourceId,
      targetId: parsed.data.targetId,
    },
  });

  return NextResponse.json({ edge });
}

export async function DELETE(req: Request, ctx: Ctx) {
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

  const parsed = edgeDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await prisma.workflowEdge.deleteMany({
    where: {
      workflowId: id,
      sourceId: parsed.data.sourceId,
      targetId: parsed.data.targetId,
    },
  });

  return NextResponse.json({ ok: true });
}
