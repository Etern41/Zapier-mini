import { prisma } from "@/lib/prisma";
import type { RecordStringUnknown } from "@/lib/executor/types";

type DbCfg = {
  operation?: string;
  query?: string;
};

export async function runDbStep(config: RecordStringUnknown): Promise<unknown> {
  const c = config as DbCfg;
  const q = c.query?.trim();
  if (!q) throw new Error("SQL query is required");

  const op = (c.operation ?? "SELECT").toUpperCase();

  if (op === "SELECT") {
    const rows = await prisma.$queryRawUnsafe<unknown[]>(q);
    return { rows };
  }

  const result = await prisma.$executeRawUnsafe(q);
  return { affected: result };
}
