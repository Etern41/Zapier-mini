import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/api-auth";
import { workflowUpdateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnedWorkflow(userId: string, id: string) {
  return prisma.workflow.findFirst({
    where: { id, userId },
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;
  const { id } = await ctx.params;

  const wf = await prisma.workflow.findFirst({
    where: { id, userId: u.userId },
    include: {
      nodes: { orderBy: { order: "asc" } },
      edges: true,
    },
  });

  if (!wf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ workflow: wf });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;
  const { id } = await ctx.params;

  const owned = await getOwnedWorkflow(u.userId, id);
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = workflowUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const wf = await prisma.workflow.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && {
        description: parsed.data.description ?? null,
      }),
    },
  });

  return NextResponse.json({ workflow: wf });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;
  const { id } = await ctx.params;

  const owned = await getOwnedWorkflow(u.userId, id);
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.workflow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
