import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/api-auth";
import { startOfDay } from "date-fns";

export async function GET() {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;

  const workflowIds = await prisma.workflow.findMany({
    where: { userId: u.userId },
    select: { id: true },
  });
  const ids = workflowIds.map((w) => w.id);

  if (ids.length === 0) {
    return NextResponse.json({
      totalWorkflows: 0,
      activeWorkflows: 0,
      runsToday: 0,
      successRate: 0,
      runsByDay: [],
      runsByWorkflow: [],
      recentFailures: [],
    });
  }

  const [totalWorkflows, activeWorkflows, runsTodayAgg, statusAgg, runs] =
    await Promise.all([
      prisma.workflow.count({ where: { userId: u.userId } }),
      prisma.workflow.count({
        where: { userId: u.userId, isActive: true },
      }),
      prisma.workflowRun.count({
        where: {
          workflowId: { in: ids },
          startedAt: { gte: startOfDay(new Date()) },
        },
      }),
      prisma.workflowRun.groupBy({
        by: ["status"],
        where: { workflowId: { in: ids } },
        _count: { _all: true },
      }),
      prisma.workflowRun.findMany({
        where: { workflowId: { in: ids } },
        orderBy: { startedAt: "desc" },
        take: 500,
        select: { id: true, status: true, startedAt: true, workflowId: true },
      }),
    ]);

  const totalFinished = statusAgg.reduce((s, x) => s + x._count._all, 0);
  const successCount =
    statusAgg.find((x) => x.status === "SUCCESS")?._count._all ?? 0;
  const successRate =
    totalFinished > 0 ? Math.round((successCount / totalFinished) * 100) : 0;

  const byDayMap = new Map<string, number>();
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const r of runs) {
    if (r.startedAt.getTime() < since) continue;
    const key = r.startedAt.toISOString().slice(0, 10);
    byDayMap.set(key, (byDayMap.get(key) ?? 0) + 1);
  }
  const runsByDay = Array.from(byDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const wfCounts = new Map<string, number>();
  for (const r of runs) {
    wfCounts.set(r.workflowId, (wfCounts.get(r.workflowId) ?? 0) + 1);
  }
  const wfMeta = await prisma.workflow.findMany({
    where: { userId: u.userId },
    select: { id: true, name: true },
  });
  const runsByWorkflow = wfMeta.map((w) => ({
    id: w.id,
    name: w.name,
    count: wfCounts.get(w.id) ?? 0,
  }));

  const failedRuns = await prisma.workflowRun.findMany({
    where: { workflowId: { in: ids }, status: "FAILED" },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: { workflow: { select: { name: true } } },
  });

  const recentFailures = failedRuns.map((r) => ({
    id: r.id,
    workflowId: r.workflowId,
    workflowName: r.workflow.name,
    error: r.error,
    startedAt: r.startedAt.toISOString(),
  }));

  return NextResponse.json({
    totalWorkflows,
    activeWorkflows,
    runsToday: runsTodayAgg,
    successRate,
    runsByDay,
    runsByWorkflow,
    recentFailures,
  });
}
