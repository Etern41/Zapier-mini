"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type TriggerNodeData = {
  label: string;
  summary: string;
  configured: boolean;
  status: "draft" | "active" | "error";
  onSelect: () => void;
  onDelete: () => void;
};

function TriggerNodeInner({ data, selected }: NodeProps) {
  const d = data as TriggerNodeData;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "group relative w-72 cursor-pointer rounded-xl border-2 border-violet-200 bg-card shadow-sm transition-all duration-150 dark:border-violet-800",
        selected && "ring-2 ring-violet-400",
        "hover:border-violet-300 hover:shadow-lg dark:hover:border-violet-700"
      )}
      onClick={() => d.onSelect()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") d.onSelect();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-violet-500 to-purple-600" />
      <div className="relative p-4">
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
              aria-label="Меню"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  d.onSelect();
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  d.onDelete();
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="size-4 shrink-0 text-violet-500" />
          <span className="text-xs uppercase text-muted-foreground">
            Trigger
          </span>
          <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            1
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">
          {d.label || "Choose a trigger"}
        </p>
        <p
          className={cn(
            "mt-1 truncate text-xs",
            d.configured ? "text-muted-foreground" : "text-violet-500"
          )}
        >
          {d.configured ? d.summary : "Click to configure →"}
        </p>
        {d.configured ? (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full",
                d.status === "draft" && "bg-muted-foreground",
                d.status === "active" && "bg-success",
                d.status === "error" && "bg-destructive"
              )}
            />
          </div>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-violet-500" />
    </div>
  );
}

export const TriggerNode = memo(TriggerNodeInner);
