import type { z } from "zod";

/** Parse JSON from `JSON.stringify(form.watch())` and validate; skip autosave if invalid. */
export function safeDebouncedConfig<T>(
  debounceKey: string,
  schema: z.ZodType<T>
): T | null {
  let raw: unknown;
  try {
    raw = JSON.parse(debounceKey);
  } catch {
    return null;
  }
  const r = schema.safeParse(raw);
  return r.success ? r.data : null;
}
