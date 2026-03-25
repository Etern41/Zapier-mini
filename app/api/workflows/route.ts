import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/api-auth";
import { workflowCreateSchema } from "@/lib/validations";

export async function GET() {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;

  const workflows = await prisma.workflow.findMany({
    where: { userId: u.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { runs: true, nodes: true } },
      nodes: { select: { type: true } },
    },
  });

  const enriched = await Promise.all(
    workflows.map(async (w) => {
      const lastRun = await prisma.workflowRun.findFirst({
        where: { workflowId: w.id },
        orderBy: { startedAt: "desc" },
        select: { startedAt: true, status: true },
      });
      const grp = await prisma.workflowRun.groupBy({
        by: ["status"],
        where: { workflowId: w.id },
        _count: { _all: true },
      });
      const total = grp.reduce((s, x) => s + x._count._all, 0);
      const ok =
        grp.find((x) => x.status === "SUCCESS")?._count._all ?? 0;
      const successRate = total > 0 ? Math.round((ok / total) * 100) : 0;
      return {
        ...w,
        lastRun,
        successRate,
      };
    })
  );

  return NextResponse.json({ workflows: enriched });
}

export async function POST(req: Request) {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = workflowCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid data" },
      { status: 400 }
    );
  }

  const wf = await prisma.workflow.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? undefined,
      userId: u.userId,
    },
  });

  return NextResponse.json({ workflow: wf });
}
