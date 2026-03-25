"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Clock, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

type WfRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count: { runs: number; nodes: number };
  lastRun: { startedAt: string; status: string } | null;
  successRate: number;
};

type Analytics = {
  totalWorkflows: number;
  activeWorkflows: number;
  runsToday: number;
  successRate: number;
};

export function WorkflowList() {
  const [workflows, setWorkflows] = useState<WfRow[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleBusy, setToggleBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [wRes, aRes] = await Promise.all([
      fetch("/api/workflows"),
      fetch("/api/analytics"),
    ]);
    if (wRes.ok) {
      const d = (await wRes.json()) as { workflows: WfRow[] };
      setWorkflows(
        d.workflows.map((x) => ({
          ...x,
          lastRun: x.lastRun
            ? {
                ...x.lastRun,
                startedAt:
                  typeof x.lastRun.startedAt === "string"
                    ? x.lastRun.startedAt
                    : new Date(x.lastRun.startedAt).toISOString(),
              }
            : null,
        }))
      );
    }
    if (aRes.ok) {
      const a = (await aRes.json()) as Analytics;
      setAnalytics(a);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      void load();
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-auto p-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-semibold text-foreground">
            {analytics?.totalWorkflows ?? workflows.length}
          </p>
          <p className="text-sm text-muted-foreground">workflows</p>
        </Card>
        <Card className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold text-foreground">
              {analytics?.activeWorkflows ??
                workflows.filter((w) => w.isActive).length}
            </p>
            <span
              className="size-2 rounded-full bg-success"
              aria-hidden
            />
          </div>
          <p className="text-sm text-muted-foreground">Active</p>
        </Card>
        <Card className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold text-foreground">
              {analytics?.runsToday ?? 0}
            </p>
            <Clock className="size-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Runs Today</p>
        </Card>
        <Card className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-semibold text-foreground">
            {analytics?.successRate ?? 0}%
          </p>
          <Progress
            value={analytics?.successRate ?? 0}
            className="mt-2 h-2"
          />
          <p className="mt-1 text-sm text-muted-foreground">Success Rate</p>
        </Card>
      </div>

      <div className="flex justify-end">
        <CreateWorkflowModal />
      </div>

      <Card className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 border-b bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Name</span>
          <span>Status</span>
          <span>Last Run</span>
          <span>Total Runs</span>
          <span>Success %</span>
          <span className="text-right">Actions</span>
        </div>
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="text-6xl" aria-hidden>
              ⚡
            </div>
            <p className="text-lg font-medium text-foreground">
              No workflows yet
            </p>
            <CreateWorkflowModal />
          </div>
        ) : (
          workflows.map((w) => (
            <div
              key={w.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-2 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {w.name}
                </p>
                {w.description ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {w.description}
                  </p>
                ) : null}
              </div>
              <div>
                <Switch
                  checked={w.isActive}
                  disabled={toggleBusy === w.id}
                  onCheckedChange={(v) => void setActive(w.id, v)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {w.lastRun
                  ? formatDistanceToNow(new Date(w.lastRun.startedAt), {
                      addSuffix: true,
                      locale: ru,
                    })
                  : "Never"}
              </div>
              <div className="text-sm tabular-nums text-foreground">
                {w._count.runs}
              </div>
              <div>
                <Badge
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-normal",
                    w._count.runs > 0 &&
                      w.successRate >= 80 &&
                      "border-success/30 bg-success/15 text-success",
                    w._count.runs > 0 &&
                      w.successRate < 80 &&
                      w.successRate >= 50 &&
                      "border-warning/40 bg-warning/15 text-warning-foreground",
                    w._count.runs > 0 &&
                      w.successRate < 50 &&
                      "border-destructive/40 bg-destructive/10 text-destructive"
                  )}
                >
                  {w._count.runs === 0 ? "—" : `${w.successRate}%`}
                </Badge>
              </div>
              <div className="flex justify-end gap-1">
                <Link
                  href={`/workflows/${w.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Pencil className="mr-1 inline size-3.5" />
                  Edit
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteId(w.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить workflow?</DialogTitle>
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
