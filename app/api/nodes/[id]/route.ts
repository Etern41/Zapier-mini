import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/api-auth";
import { nodeUpdateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;
  const { id } = await ctx.params;

  const node = await prisma.workflowNode.findFirst({
    where: { id },
    include: { workflow: true },
  });

  if (!node || node.workflow.userId !== u.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = nodeUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const updated = await prisma.workflowNode.update({
    where: { id },
    data: {
      ...(parsed.data.config !== undefined && {
        config: parsed.data.config as object,
      }),
      ...(parsed.data.label !== undefined && { label: parsed.data.label }),
      ...(parsed.data.positionX !== undefined && {
        positionX: parsed.data.positionX,
      }),
      ...(parsed.data.positionY !== undefined && {
        positionY: parsed.data.positionY,
      }),
      ...(parsed.data.order !== undefined && { order: parsed.data.order }),
    },
  });

  return NextResponse.json({ node: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;
  const { id } = await ctx.params;

  const node = await prisma.workflowNode.findFirst({
    where: { id },
    include: { workflow: true },
  });

  if (!node || node.workflow.userId !== u.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.workflowEdge.deleteMany({
    where: {
      workflowId: node.workflowId,
      OR: [{ sourceId: id }, { targetId: id }],
    },
  });

  await prisma.workflowNode.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
