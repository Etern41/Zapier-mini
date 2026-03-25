import { format, parseISO, isValid } from "date-fns";
import type { RecordStringUnknown } from "@/lib/executor/types";

function getPath(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function safeMath(expr: string): number {
  const trimmed = expr.replace(/\s+/g, "");
  if (!/^[\d+\-*/().]+$/.test(trimmed)) {
    throw new Error("Math expression contains invalid characters");
  }
  const fn = new Function(`"use strict"; return (${trimmed})`);
  const v = fn();
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error("Math expression did not evaluate to a finite number");
  }
  return v;
}

type TransformCfg = {
  operation?: string;
  input?: string;
  fieldPath?: string;
  mapExpr?: string;
  filterExpr?: string;
  dateFormat?: string;
  mathExpr?: string;
};

export function runTransformStepSync(config: RecordStringUnknown): unknown {
  const c = config as TransformCfg;
  const op = c.operation ?? "parse_json";
  const raw = c.input ?? "";

  switch (op) {
    case "parse_json": {
      if (!raw.trim()) return null;
      return JSON.parse(raw);
    }
    case "extract_field": {
      const parsed = JSON.parse(raw);
      return getPath(parsed, c.fieldPath ?? "");
    }
    case "map_array": {
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array");
      const path = c.mapExpr?.trim() ?? "";
      return parsed.map((item) => getPath(item, path));
    }
    case "filter_array": {
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array");
      const cond = c.filterExpr?.trim() ?? "true";
      return parsed.filter((item) => {
        const fn = new Function(
          "item",
          `"use strict"; return Boolean(${cond})`
        );
        return fn(item);
      });
    }
    case "format_date": {
      const d = parseISO(raw);
      if (!isValid(d)) throw new Error("Invalid date input");
      return format(d, c.dateFormat ?? "yyyy-MM-dd HH:mm");
    }
    case "math": {
      return safeMath(c.mathExpr ?? raw);
    }
    default:
      return raw;
  }
}

export async function runTransformStep(
  config: RecordStringUnknown
): Promise<unknown> {
  return runTransformStepSync(config);
}
