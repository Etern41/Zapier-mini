"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ActionNodeData = {
  label: string;
  stepLabel: string;
  summary: string;
  configured: boolean;
  status: "draft" | "active" | "error";
  onSelect: () => void;
  onDelete: () => void;
};

function ActionNodeInner({ data, selected }: NodeProps) {
  const d = data as ActionNodeData;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "group relative w-72 cursor-pointer rounded-xl border-2 border-gray-200 bg-card shadow-sm transition-all duration-150 dark:border-gray-700",
        selected && "ring-2 ring-primary/40",
        "hover:shadow-lg"
      )}
      onClick={() => d.onSelect()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") d.onSelect();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-blue-500 to-cyan-500" />
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
          <Play className="size-4 shrink-0 text-blue-500" />
          <span className="text-xs uppercase text-muted-foreground">
            {d.stepLabel}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">
          {d.label || "Action"}
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
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}

export const ActionNode = memo(ActionNodeInner);
