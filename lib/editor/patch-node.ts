export async function patchNode(
  nodeId: string,
  body: Record<string, unknown>
): Promise<boolean> {
  const res = await fetch(`/api/nodes/${nodeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}
