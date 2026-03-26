"use client";

import { useEffect, useMemo, useState } from "react";
import { ListPagination } from "@/components/ui/list-pagination";
import { subDays, isAfter } from "date-fns";
import { Search } from "lucide-react";
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

const PAGE_SIZE = 20;

export function GlobalHistoryClient({ runs }: { runs: RunRow[] }) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [listPage, setListPage] = useState(1);
  const [wf, setWf] = useState<string>("all");
  const [range, setRange] = useState<"all" | "7d" | "24h">("all");
  const [status, setStatus] = useState<
    "all" | "SUCCESS" | "FAILED" | "RUNNING" | "PENDING"
  >("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 260);
    return () => clearTimeout(t);
  }, [q]);

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
    const qq = debouncedQ.toLowerCase();
    return runs.filter((r) => {
      if (since && !isAfter(new Date(r.startedAt), since)) return false;
      if (status !== "all") {
        if (status === "FAILED") {
          if (r.status !== "FAILED" && r.status !== "ERROR") return false;
        } else if (r.status !== status) {
          return false;
        }
      }
      if (wf !== "all" && r.workflow?.id !== wf) return false;
      if (qq) {
        const name = r.workflow?.name?.toLowerCase() ?? "";
        if (!name.includes(qq)) return false;
      }
      return true;
    });
  }, [runs, debouncedQ, wf, range, status]);

  useEffect(() => {
    setListPage(1);
  }, [debouncedQ, wf, range, status]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, listPage), totalPages);
  const pageSlice = useMemo(
    () =>
      filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto bg-background p-6">
      <h1 className="sr-only">История запусков</h1>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="По названию воркфлоу"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Поиск по истории"
          />
        </div>
        <Select value={wf} onValueChange={(v) => setWf(v ?? "all")}>
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
            <SelectItem value="PENDING">
              {runStatusLabelRu("PENDING")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <RunsTable
        runs={pageSlice}
        showWorkflow
        footer={
          <ListPagination
            page={safePage}
            pageSize={PAGE_SIZE}
            total={totalFiltered}
            onPageChange={setListPage}
          />
        }
      />
    </div>
  );
}
