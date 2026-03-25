import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSessionUser, isActionType, isTriggerType } from "@/lib/api-auth";

type Ctx = { params: Promise<{ id: string }> };

async function handlePublish(req: Request, ctx: Ctx) {
  const u = await requireSessionUser();
  if ("response" in u) return u.response;
  const { id } = await ctx.params;

  const wf = await prisma.workflow.findFirst({
    where: { id, userId: u.userId },
    include: { nodes: true },
  });

  if (!wf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { active?: boolean } = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    body = {};
  }

  const nextActive =
    typeof body.active === "boolean" ? body.active : !wf.isActive;

  if (nextActive) {
    const triggers = wf.nodes.filter((n) => isTriggerType(n.type));
    const actions = wf.nodes.filter((n) => isActionType(n.type));
    if (triggers.length < 1 || actions.length < 1) {
      return NextResponse.json(
        {
          error:
            "Нужен минимум один триггер и одно действие для активации workflow",
          isActive: wf.isActive,
        },
        { status: 400 }
      );
    }

    let webhookSecret = wf.webhookSecret;
    const hasWebhook = triggers.some((t) => t.type === "TRIGGER_WEBHOOK");
    if (hasWebhook && !webhookSecret) {
      webhookSecret = randomBytes(24).toString("hex");
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: { isActive: true, ...(webhookSecret && { webhookSecret }) },
    });

    return NextResponse.json({ isActive: updated.isActive });
  }

  const updated = await prisma.workflow.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ isActive: updated.isActive });
}

export const POST = handlePublish;
export const PATCH = handlePublish;
