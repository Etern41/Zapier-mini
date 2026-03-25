import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireSessionUser(): Promise<
  | { userId: string }
  | { response: NextResponse }
> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { userId: id };
}

export function isTriggerType(type: string): boolean {
  return type.startsWith("TRIGGER_");
}

export function isActionType(type: string): boolean {
  return type.startsWith("ACTION_");
}
