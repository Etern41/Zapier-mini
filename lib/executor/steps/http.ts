import axios, { type AxiosRequestConfig } from "axios";
import type { RecordStringUnknown } from "@/lib/executor/types";

type HttpConfig = {
  method?: string;
  url?: string;
  headers?: Array<{ key: string; value: string }>;
  body?: string;
  authType?: string;
  authValue?: string;
};

export async function runHttpStep(
  config: RecordStringUnknown
): Promise<unknown> {
  const c = config as HttpConfig;
  const method = (c.method ?? "GET").toUpperCase();
  const url = c.url;
  if (!url) throw new Error("HTTP URL is required");

  const headers: Record<string, string> = {};
  for (const h of c.headers ?? []) {
    if (h.key) headers[h.key] = h.value ?? "";
  }

  if (c.authType === "bearer" && c.authValue) {
    headers.Authorization = `Bearer ${c.authValue}`;
  }
  if (c.authType === "basic" && c.authValue) {
    headers.Authorization = `Basic ${Buffer.from(c.authValue).toString("base64")}`;
  }

  const hasBody =
    method === "POST" || method === "PUT" || method === "PATCH";

  const ax: AxiosRequestConfig = {
    method,
    url,
    headers,
    validateStatus: () => true,
  };

  if (hasBody && c.body !== undefined && c.body !== "") {
    try {
      ax.data = JSON.parse(c.body);
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
    } catch {
      ax.data = c.body;
    }
  }

  const res = await axios(ax);
  const body =
    typeof res.data === "object"
      ? res.data
      : { raw: res.data, status: res.status };

  if (res.status >= 400) {
    throw new Error(
      `HTTP ${res.status}: ${typeof res.data === "string" ? res.data : JSON.stringify(res.data)}`
    );
  }

  return { status: res.status, data: body, headers: res.headers };
}
