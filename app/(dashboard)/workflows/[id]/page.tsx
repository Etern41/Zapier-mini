import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  WorkflowEditor,
  type WorkflowPayload,
} from "@/components/editor/WorkflowEditor";

export default async function WorkflowEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const workflow = await prisma.workflow.findFirst({
    where: { id, userId: session.user.id },
    include: {
      nodes: { orderBy: { order: "asc" } },
      edges: true,
    },
  });

  if (!workflow) notFound();

  const payload = JSON.parse(JSON.stringify(workflow)) as WorkflowPayload;

  return <WorkflowEditor initial={payload} />;
}
