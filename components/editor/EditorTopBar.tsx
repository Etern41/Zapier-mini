"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Undo2 } from "lucide-react";
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
      toast.success("Название сохранено");
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
          <button
            type="button"
            className="truncate text-left text-sm font-semibold text-foreground hover:underline"
            onClick={() => setEditing(true)}
          >
            {name}
          </button>
        )}
        <WorkflowStatusBadge active={isActive} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          title="Скоро"
          className="hidden sm:inline-flex"
        >
          <Undo2 className="mr-1 size-3.5" />
          Отменить
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={testBusy}
          onClick={() => void testRun()}
        >
          {testBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Тестовый запуск"
          )}
        </Button>
        <Button
          size="sm"
          variant={isActive ? "outline" : "default"}
          disabled={pubBusy}
          onClick={() => void publish(!isActive)}
        >
          {pubBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isActive ? (
            "Остановить"
          ) : (
            "Опубликовать"
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={saveState === "saving"}
          onClick={() => void saveName()}
          className="hidden md:inline-flex"
        >
          {saveState === "saving" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saveState === "saved" ? (
            <>
              <Check className="mr-1 size-3.5 text-success" />
              Сохранено
            </>
          ) : (
            "Сохранить"
          )}
        </Button>
      </div>
    </div>
  );
}
