import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/api-auth";
import { runWorkflowSchema } from "@/lib/validations";
import { runWorkflow } from "@/lib/executor";

type Ctx = { params: Promise<{ id: string }> };

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
    body = {};
  }

  const parsed = runWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const testMode = parsed.data.testMode === true;
  const trigger = testMode ? "test" : "manual";

  try {
    const result = await runWorkflow(id, { _test: testMode }, trigger);
    const runRow = await prisma.workflowRun.findUnique({
      where: { id: result.runId },
      include: { steps: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({
      ...result,
      run: runRow,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
