import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/api-auth";

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

  const runs = await prisma.workflowRun.findMany({
    where: { workflowId: id },
    orderBy: { startedAt: "desc" },
    take: 100,
    include: { steps: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ runs });
}
