"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Filter,
  Zap,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { NodeType } from "@prisma/client";
import { workflowNodeIcons } from "@/lib/workflow-app-icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateWorkflowModal } from "@/components/workflows/CreateWorkflowModal";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/relative-time";

type WfRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
  _count: { runs: number; nodes: number };
  nodes: { type: NodeType }[];
  lastRun: { startedAt: string; status: string } | null;
  successRate: number;
};

type Analytics = {
  totalWorkflows: number;
  activeWorkflows: number;
  runsToday: number;
  successRate: number;
};

type ExtraFilter =
  | "none"
  | "hasRuns"
  | "noRuns"
  | "hasTrigger"
  | "noTrigger";

type TriggerTypeFilter =
  | "all"
  | "TRIGGER_WEBHOOK"
  | "TRIGGER_SCHEDULE"
  | "TRIGGER_EMAIL";

function hasTriggerNode(nodes: { type: NodeType }[]) {
  return nodes.some((n) => String(n.type).startsWith("TRIGGER"));
}

function hasTriggerType(
  nodes: { type: NodeType }[],
  triggerType: TriggerTypeFilter
) {
  if (triggerType === "all") return true;
  return nodes.some((n) => n.type === triggerType);
}

function EmptyZapsIllustration() {
  return (
    <svg
      className="mx-auto h-32 w-32 text-muted-foreground/40"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" />
      <path
        d="M45 55h30M45 65h20M55 45v30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="8" fill="hsl(var(--primary))" opacity="0.3" />
    </svg>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

export function WorkflowList() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WfRow[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleBusy, setToggleBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">(
    "all"
  );
  const [extraFilter, setExtraFilter] = useState<ExtraFilter>("none");
  const [triggerTypeFilter, setTriggerTypeFilter] =
    useState<TriggerTypeFilter>("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [wRes, aRes] = await Promise.all([
        fetch("/api/workflows"),
        fetch("/api/analytics"),
      ]);
      if (wRes.ok) {
        const d = (await wRes.json()) as { workflows: WfRow[] };
        setWorkflows(
          d.workflows.map((x) => ({
            ...x,
            updatedAt:
              typeof x.updatedAt === "string"
                ? x.updatedAt
                : new Date(x.updatedAt as unknown as Date).toISOString(),
            lastRun: x.lastRun
              ? {
                  ...x.lastRun,
                  startedAt:
                    typeof x.lastRun.startedAt === "string"
                      ? x.lastRun.startedAt
                      : new Date(x.lastRun.startedAt).toISOString(),
                }
              : null,
            nodes: x.nodes ?? [],
          }))
        );
      } else {
        const j = (await wRes.json().catch(() => ({}))) as { error?: string };
        const msg = j.error ?? "Не удалось загрузить Zaps";
        setLoadError(msg);
        toast.error(msg);
      }
      if (aRes.ok) {
        const a = (await aRes.json()) as Analytics;
        setAnalytics(a);
      } else if (wRes.ok) {
        toast.error("Не удалось загрузить сводку аналитики");
      }
    } catch {
      const msg = "Сеть недоступна. Проверьте подключение.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return workflows.filter((w) => {
      if (statusFilter === "active" && !w.isActive) return false;
      if (statusFilter === "draft" && w.isActive) return false;
      if (extraFilter === "hasRuns" && w._count.runs <= 0) return false;
      if (extraFilter === "noRuns" && w._count.runs > 0) return false;
      if (extraFilter === "hasTrigger" && !hasTriggerNode(w.nodes)) return false;
      if (extraFilter === "noTrigger" && hasTriggerNode(w.nodes)) return false;
      if (!hasTriggerType(w.nodes, triggerTypeFilter)) return false;
      if (!q) return true;
      if (w.name.toLowerCase().includes(q)) return true;
      if (w.description?.toLowerCase().includes(q)) return true;
      return w.id.toLowerCase().includes(q);
    });
  }, [workflows, debouncedSearch, statusFilter, extraFilter, triggerTypeFilter]);

  const hasActiveFilters =
    debouncedSearch !== "" ||
    statusFilter !== "all" ||
    extraFilter !== "none" ||
    triggerTypeFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setExtraFilter("none");
    setTriggerTypeFilter("all");
  };

  const setActive = async (id: string, active: boolean) => {
    setToggleBusy(id);
    try {
      const res = await fetch(`/api/workflows/${id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const j = (await res.json()) as { error?: string; isActive?: boolean };
      if (!res.ok) {
        toast.error(j.error ?? "Не удалось обновить статус");
        return;
      }
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, isActive: j.isActive ?? active } : w
        )
      );
      toast.success(active ? "Zap опубликован" : "Zap остановлен");
    } finally {
      setToggleBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workflows/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        toast.error(j.error ?? "Ошибка удаления");
        return;
      }
      setWorkflows((prev) => prev.filter((w) => w.id !== deleteId));
      setDeleteId(null);
      toast.success("Zap удалён");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto bg-background p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title">Zaps</h1>
        <div className="flex items-center gap-2">
          <CreateWorkflowModal />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск по названию или webhook URL"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск Zaps"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as "all" | "active" | "draft")
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Фильтр" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все Zaps</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="draft">Черновики</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "shrink-0 gap-2"
            )}
            aria-label="Фильтры"
          >
            <Filter className="size-4" />
            Фильтры
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => {
                setExtraFilter("none");
                setTriggerTypeFilter("all");
              }}
            >
              Сбросить все фильтры
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setExtraFilter("hasRuns")}>
              С запусками
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExtraFilter("noRuns")}>
              Без запусков
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExtraFilter("hasTrigger")}>
              С триггером
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExtraFilter("noTrigger")}>
              Без триггера
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTriggerTypeFilter("all")}>
              Любой тип триггера
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTriggerTypeFilter("TRIGGER_WEBHOOK")}
            >
              Триггер: Webhook
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTriggerTypeFilter("TRIGGER_SCHEDULE")}
            >
              Триггер: Расписание
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTriggerTypeFilter("TRIGGER_EMAIL")}
            >
              Триггер: Email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="shrink-0"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Обновить"
        >
          <RefreshCw
            className={cn("size-4", loading && "animate-spin")}
          />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading && !workflows.length ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card p-4 shadow-card-zapier">
              <p className="text-[28px] font-bold leading-tight text-foreground">
                {analytics?.totalWorkflows ?? workflows.length}
              </p>
              <p className="text-xs text-muted-foreground">Всего Zaps</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-card-zapier">
              <p className="text-[28px] font-bold leading-tight text-foreground">
                {analytics?.activeWorkflows ??
                  workflows.filter((w) => w.isActive).length}
              </p>
              <p className="text-xs text-muted-foreground">Активные</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-card-zapier">
              <div className="flex items-center gap-2">
                <p className="text-[28px] font-bold leading-tight text-foreground">
                  {analytics?.runsToday ?? 0}
                </p>
                <Clock className="size-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Запусков сегодня</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-card-zapier">
              <p className="text-[28px] font-bold leading-tight text-foreground">
                {analytics?.successRate ?? 0}%
              </p>
              <p className="text-xs text-muted-foreground">Успешность (%)</p>
            </div>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card-zapier">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="section-label px-4 py-3 text-left font-medium">
                Название
              </th>
              <th className="section-label px-4 py-3 text-left font-medium">
                Приложения
              </th>
              <th className="section-label px-4 py-3 text-left font-medium">
                Последнее изменение
              </th>
              <th className="section-label px-4 py-3 text-left font-medium">
                Статус
              </th>
              <th className="section-label px-4 py-3 text-right font-medium">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && !workflows.length ? (
              <tr>
                <td colSpan={5}>
                  <TableSkeleton />
                </td>
              </tr>
            ) : loadError && !workflows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Не удалось загрузить Zaps
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {loadError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6"
                    onClick={() => void load()}
                  >
                    Повторить
                  </Button>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  {workflows.length === 0 ? (
                    <>
                      <EmptyZapsIllustration />
                      <p className="page-title mt-4">Zaps</p>
                      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                        Создайте первый Zap, подключив два приложения
                      </p>
                      <div className="mt-6 flex justify-center">
                        <CreateWorkflowModal label="+ Создать Zap" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Ничего не найдено по запросу
                      </p>
                      {hasActiveFilters ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetFilters}
                        >
                          Сбросить фильтры
                        </Button>
                      ) : null}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((w) => {
                const Icons = workflowNodeIcons(w.nodes);
                return (
                  <tr
                    key={w.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="max-w-[280px] px-4 py-3">
                      <Link
                        href={`/workflows/${w.id}`}
                        className="group flex min-w-0 items-start gap-2"
                      >
                        <Zap className="mt-0.5 size-4 shrink-0 text-[hsl(var(--primary))]" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground group-hover:underline">
                            {w.name}
                          </span>
                          {w.description ? (
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {w.description}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Icons.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          Icons.map((Icon, i) => (
                            <span
                              key={`${w.id}-ic-${i}`}
                              className="flex size-5 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground"
                              title=""
                            >
                              <Icon className="size-3" />
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {relativeTime(w.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={w.isActive}
                          disabled={toggleBusy === w.id}
                          onCheckedChange={(v) => void setActive(w.id, v)}
                          title={
                            toggleBusy === w.id
                              ? "Сохранение…"
                              : w.isActive
                                ? "Опубликован: триггеры (webhook, расписание и т.д.) запускают Zap."
                                : "Черновик: триггеры не работают, доступен только тест из редактора."
                          }
                          aria-label={
                            w.isActive ? "Остановить Zap" : "Опубликовать Zap"
                          }
                        />
                        {toggleBusy === w.id ? (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={cn(
                            buttonVariants({
                              variant: "outline",
                              size: "icon-sm",
                            }),
                            "size-8"
                          )}
                          aria-label="Действия"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-[12rem]"
                        >
                          <DropdownMenuItem
                            className="whitespace-nowrap"
                            onClick={() => router.push(`/workflows/${w.id}`)}
                          >
                            <Pencil className="mr-2 size-4 shrink-0" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteId(w.id)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="z-[100]">
          <DialogHeader>
            <DialogTitle>Удалить Zap?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Все узлы, связи и история запусков
              будут удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Удалить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
