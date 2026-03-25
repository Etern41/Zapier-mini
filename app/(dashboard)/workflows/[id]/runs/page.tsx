import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RunsTable } from "@/components/runs/RunsTable";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function WorkflowRunsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const workflow = await prisma.workflow.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!workflow) notFound();

  const runs = await prisma.workflowRun.findMany({
    where: { workflowId: id },
    orderBy: { startedAt: "desc" },
    take: 100,
    include: { steps: { orderBy: { createdAt: "asc" } } },
  });

  const serialized = JSON.parse(JSON.stringify(runs)) as import("@/components/runs/RunsTable").RunRow[];

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/workflows/${id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="mr-1 inline size-4" />
          Редактор
        </Link>
        <h1 className="text-lg font-semibold text-foreground">
          История: {workflow.name}
        </h1>
      </div>
      <RunsTable runs={serialized} />
    </div>
  );
}
