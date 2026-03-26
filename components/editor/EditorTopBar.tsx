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
import { MobileNav } from "@/components/layout/MobileNav";

export function EditorTopBar({
  workflowId,
  name: initialName,
  isActive: initialActive,
  onSaved,
  userName,
  userEmail,
}: {
  workflowId: string;
  name: string;
  isActive: boolean;
  onSaved?: () => void;
  userName: string;
  userEmail?: string | null;
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
    <div className="z-10 flex shrink-0 flex-col gap-2 border-b border-border bg-card px-3 py-2 sm:h-[52px] sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-0">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <MobileNav userName={userName} userEmail={userEmail} />
        <Link
          href="/workflows"
          aria-label="Назад к Zaps"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "size-8 shrink-0"
          )}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
            <Link href="/workflows" className="hover:text-foreground">
              Zaps
            </Link>
            <span aria-hidden>/</span>
          </nav>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-initial">
            {editing ? (
              <Input
                className="h-8 min-w-0 flex-1 sm:max-w-md"
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
                className="h-auto min-w-0 max-w-full flex-1 truncate px-1 py-0 text-left text-sm font-semibold text-foreground hover:underline sm:max-w-md sm:flex-initial"
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
              <span className="hidden text-xs text-success transition-opacity duration-300 sm:inline">
                ✓ Сохранено
              </span>
            ) : null}
          </div>
          <WorkflowStatusBadge active={isActive} className="shrink-0" />
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0 sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={testBusy}
          onClick={() => void testRun()}
          className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
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
          className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
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
