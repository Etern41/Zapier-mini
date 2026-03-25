"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { WorkflowStatusBadge } from "@/components/workflows/WorkflowStatusBadge";

export function EditorTopBar({
  workflowId,
  name: initialName,
  isActive: initialActive,
  onSaved,
}: {
  workflowId: string;
  name: string;
  isActive: boolean;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [isActive, setIsActive] = useState(initialActive);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [pubBusy, setPubBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);

  useEffect(() => {
    setName(initialName);
    setIsActive(initialActive);
  }, [initialName, initialActive]);

  const saveName = useCallback(async () => {
    const trimmed = name.slice(0, 120);
    if (trimmed === initialName) {
      setEditing(false);
      return;
    }
    setSaveState("saving");
    const res = await fetch(`/api/workflows/${workflowId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      setName(trimmed);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
      onSaved?.();
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error ?? "Не удалось сохранить название");
      setSaveState("idle");
    }
    setEditing(false);
  }, [name, initialName, workflowId, onSaved]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void saveName();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveName]);

  const publish = async (active: boolean) => {
    setPubBusy(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const j = (await res.json()) as { error?: string; isActive?: boolean };
      if (!res.ok) {
        toast.error(j.error ?? "Не удалось изменить статус публикации");
        return;
      }
      setIsActive(j.isActive ?? active);
      toast.success(active ? "Zap опубликован" : "Zap остановлен");
      onSaved?.();
    } finally {
      setPubBusy(false);
    }
  };

  const testRun = async () => {
    setTestBusy(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMode: true }),
      });
      const j = (await res.json()) as { error?: string; run?: unknown };
      if (!res.ok) {
        toast.error(j.error ?? "Тестовый запуск не удался");
        return;
      }
      toast.success("Тестовый запуск поставлен в очередь");
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <div className="z-10 flex h-[52px] shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <Link
        href="/workflows"
        aria-label="Назад к Zaps"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8"
        )}
      >
        <ArrowLeft className="size-4" />
      </Link>
      <Separator orientation="vertical" className="h-5" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/workflows" className="hover:text-foreground">
            Zaps
          </Link>
          <span aria-hidden>/</span>
        </nav>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {editing ? (
            <Input
              className="h-8 max-w-md"
              value={name}
              maxLength={120}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onBlur={() => void saveName()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void saveName();
              }}
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-auto max-w-md truncate px-1 py-0 text-sm font-semibold text-foreground hover:underline"
              onClick={() => setEditing(true)}
            >
              {name}
            </Button>
          )}
          {saveState === "saving" ? (
            <Loader2
              className="size-4 shrink-0 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
          {saveState === "saved" ? (
            <span className="text-xs text-success transition-opacity duration-300">
              ✓ Сохранено
            </span>
          ) : null}
        </div>
        <WorkflowStatusBadge active={isActive} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={testBusy}
          onClick={() => void testRun()}
          className="inline-flex min-w-[10.5rem] items-center justify-center gap-2"
          aria-busy={testBusy}
        >
          {testBusy ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          ) : null}
          Тестовый запуск
        </Button>
        <Button
          size="sm"
          variant={isActive ? "outline" : "default"}
          disabled={pubBusy}
          onClick={() => void publish(!isActive)}
          className="inline-flex min-w-[9.5rem] items-center justify-center gap-2"
          aria-busy={pubBusy}
        >
          {pubBusy ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          ) : null}
          {isActive ? "Остановить" : "Опубликовать"}
        </Button>
      </div>
    </div>
  );
}
