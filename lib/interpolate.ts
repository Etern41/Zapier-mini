function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/**
 * Replace {{nodeId.field.nested}} using context keys as node ids.
 * Missing paths leave the placeholder unchanged.
 */
export function interpolate(
  template: string,
  context: Record<string, unknown>
): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, rawPath: string) => {
    const path = String(rawPath).trim();
    const value = getByPath(context, path);
    if (value === undefined) return match;
    return formatValue(value);
  });
}

export function interpolateObject<T extends Record<string, unknown>>(
  obj: T,
  context: Record<string, unknown>
): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      out[k] = interpolate(v, context);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        typeof item === "string"
          ? interpolate(item, context)
          : typeof item === "object" && item !== null && !Array.isArray(item)
            ? interpolateObject(item as Record<string, unknown>, context)
            : item
      );
    } else if (typeof v === "object" && v !== null) {
      out[k] = interpolateObject(v as Record<string, unknown>, context);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}
