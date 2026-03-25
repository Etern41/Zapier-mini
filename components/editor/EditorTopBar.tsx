"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
      onSaved?.();
    } finally {
      setPubBusy(false);
    }
  };

  return (
    <div className="z-10 flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <Link
        href="/workflows"
        aria-label="Назад"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-8"
        )}
      >
        <ArrowLeft className="size-4" />
      </Link>
      <Separator orientation="vertical" className="h-5" />
      <div className="min-w-0 flex-1">
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
      </div>
      <WorkflowStatusBadge active={isActive} />
      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          disabled={pubBusy}
          onCheckedChange={(v) => void publish(v)}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={saveState === "saving"}
        onClick={() => void saveName()}
      >
        {saveState === "saving" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : saveState === "saved" ? (
          <>
            <Check className="mr-1 size-3.5 text-success" />
            Saved
          </>
        ) : (
          "Save"
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
          "Unpublish"
        ) : (
          "Publish"
        )}
      </Button>
    </div>
  );
}
