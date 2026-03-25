import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GlobalHistoryClient } from "@/components/runs/GlobalHistoryClient";
import type { RunRow } from "@/components/runs/RunsTable";

export default async function GlobalHistoryPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const runs = await prisma.workflowRun.findMany({
    where: { workflow: { userId } },
    orderBy: { startedAt: "desc" },
    take: 200,
    include: {
      workflow: { select: { id: true, name: true } },
      steps: { orderBy: { createdAt: "asc" } },
    },
  });

  const serialized = JSON.parse(JSON.stringify(runs)) as RunRow[];

  return <GlobalHistoryClient runs={serialized} />;
}
