import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RunsTable } from "@/components/runs/RunsTable";

export default async function GlobalHistoryPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const runs = await prisma.workflowRun.findMany({
    where: { workflow: { userId } },
    orderBy: { startedAt: "desc" },
    take: 150,
    include: {
      workflow: { select: { name: true } },
      steps: { orderBy: { createdAt: "asc" } },
    },
  });

  const serialized = JSON.parse(JSON.stringify(runs)) as import("@/components/runs/RunsTable").RunRow[];

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
      <h1 className="text-lg font-semibold text-foreground">
        История запусков
      </h1>
      <RunsTable runs={serialized} showWorkflow />
    </div>
  );
}
