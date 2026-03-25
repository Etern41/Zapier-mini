"use client";

import { Plus } from "lucide-react";

export function AddNodeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-border bg-card text-muted-foreground transition-all hover:border-violet-400 hover:bg-violet-50 hover:text-violet-500 dark:hover:bg-violet-950/40"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Добавить шаг"
    >
      <Plus className="size-3.5" />
    </button>
  );
}
