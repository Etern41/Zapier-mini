"use client";

import { useMemo, useState } from "react";
import { subDays, isAfter } from "date-fns";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RunsTable, type RunRow } from "@/components/runs/RunsTable";
import { runStatusLabelRu } from "@/lib/run-labels";

export function GlobalHistoryClient({ runs }: { runs: RunRow[] }) {
  const [q, setQ] = useState("");
  const [wf, setWf] = useState<string>("all");
  const [range, setRange] = useState<"all" | "7d" | "24h">("all");
  const [status, setStatus] = useState<"all" | "SUCCESS" | "FAILED" | "RUNNING">(
    "all"
  );

  const workflowOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of runs) {
      if (r.workflow?.id && r.workflow?.name) {
        m.set(r.workflow.id, r.workflow.name);
      }
    }
    return Array.from(m.entries()).sort((a, b) =>
      a[1].localeCompare(b[1], "ru")
    );
  }, [runs]);

  const filtered = useMemo(() => {
    const now = new Date();
    const since =
      range === "7d"
        ? subDays(now, 7)
        : range === "24h"
          ? subDays(now, 1)
          : null;
    const qq = q.trim().toLowerCase();
    return runs.filter((r) => {
      if (since && !isAfter(new Date(r.startedAt), since)) return false;
      if (status !== "all" && r.status !== status) return false;
      if (wf !== "all" && r.workflow?.id !== wf) return false;
      if (qq) {
        const name = r.workflow?.name?.toLowerCase() ?? "";
        if (!name.includes(qq) && !r.id.toLowerCase().includes(qq))
          return false;
      }
      return true;
    });
  }, [runs, q, wf, range, status]);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto bg-background p-6">
      <h1 className="page-title">История запусков</h1>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск по названию воркфлоу"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          value={wf}
          onValueChange={(v) => setWf(v ?? "all")}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Воркфлоу" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все воркфлоу</SelectItem>
            {workflowOptions.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={range}
          onValueChange={(v) => setRange((v ?? "all") as typeof range)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всё время</SelectItem>
            <SelectItem value="7d">7 дней</SelectItem>
            <SelectItem value="24h">24 часа</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) =>
            setStatus((v ?? "all") as typeof status)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="SUCCESS">{runStatusLabelRu("SUCCESS")}</SelectItem>
            <SelectItem value="FAILED">{runStatusLabelRu("FAILED")}</SelectItem>
            <SelectItem value="RUNNING">
              {runStatusLabelRu("RUNNING")}
            </SelectItem>
          </SelectContent>
        </Select>
        <div
          className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground"
          title="Фильтры"
          aria-hidden
        >
          <Filter className="size-4" />
        </div>
      </div>
      <RunsTable runs={filtered} showWorkflow />
    </div>
  );
}
