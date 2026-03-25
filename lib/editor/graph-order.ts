import type { NodeType } from "@prisma/client";

export type WfNodeLite = {
  id: string;
  type: NodeType;
  order: number;
};

export type WfEdgeLite = {
  id: string;
  sourceId: string;
  targetId: string;
};

export function chainOrder(
  nodes: WfNodeLite[],
  edges: WfEdgeLite[]
): string[] {
  const trigger = nodes.find((n) => String(n.type).startsWith("TRIGGER"));
  if (!trigger) return [...nodes].sort((a, b) => a.order - b.order).map((n) => n.id);
  const out: string[] = [];
  let cur: string | undefined = trigger.id;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    out.push(cur);
    const next = edges.find((e) => e.sourceId === cur);
    cur = next?.targetId;
  }
  for (const n of nodes) {
    if (!seen.has(n.id)) out.push(n.id);
  }
  return out;
}

/** Assign each node's `order` from the canonical chain sequence (matches server chain PATCH semantics). */
export function reindexNodeOrders<T extends WfNodeLite>(
  nodes: T[],
  edges: WfEdgeLite[]
): T[] {
  const ids = chainOrder(nodes, edges);
  const map = new Map(ids.map((id, i) => [id, i]));
  return nodes.map((n) => ({
    ...n,
    order: map.get(n.id) ?? n.order,
  }));
}

export async function patchOrderDiffs(
  before: WfNodeLite[],
  after: WfNodeLite[]
): Promise<void> {
  const tasks: Promise<void>[] = [];
  for (const n of after) {
    const prev = before.find((x) => x.id === n.id);
    if (prev?.order === n.order) continue;
    tasks.push(
      fetch(`/api/nodes/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: n.order }),
      }).then(async (res) => {
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? "order");
        }
      })
    );
  }
  await Promise.all(tasks);
}
