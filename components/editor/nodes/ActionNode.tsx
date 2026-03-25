"use client";

import { memo } from "react";
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
  stepNumber: number;
  onSelect: () => void;
  onDelete: () => void;
};

function ActionNodeInner({ data, selected }: NodeProps) {
  const d = data as ActionNodeData;
  const stepN = d.stepNumber ?? 1;

  return (
    <div
      className={cn(
        "group relative w-[340px] rounded-lg border bg-card shadow-card-zapier transition-all duration-150",
        d.configured
          ? "border-border"
          : "border-dashed border-[#D1D5DB] bg-muted/40",
        selected && "ring-2 ring-[hsl(var(--brand-purple))]"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        title="Вход: соедините с нижней точкой предыдущего шага"
        className="!pointer-events-auto !z-30 !h-4 !w-4 !border-2 !border-[hsl(var(--brand-purple))] !bg-white"
      />
      <div
        className="relative z-0 cursor-pointer p-4"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".react-flow__handle")) return;
          d.onSelect();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") d.onSelect();
        }}
        role="button"
        tabIndex={0}
      >
        <div className="pointer-events-auto absolute right-3 top-3 z-20 flex items-center gap-2">
          <span
            className="flex size-6 items-center justify-center rounded-full bg-[#FF4A00] text-xs font-semibold text-white"
            aria-label={`Шаг ${stepN}`}
          >
            {stepN}
          </span>
          <div
            className={cn(
              "opacity-0 transition-opacity group-hover:opacity-100",
              selected && "opacity-100"
            )}
          >
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
                aria-label="Меню узла"
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={6}
                className="z-[200]"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    d.onSelect();
                  }}
                >
                  Настроить
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    d.onDelete();
                  }}
                >
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pr-16">
          <Play className="size-4 shrink-0 text-muted-foreground" />
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Действие
          </span>
          <span className="text-[10px] text-muted-foreground">{d.stepLabel}</span>
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground">
          {d.label || "Действие"}
        </p>
        <p
          className={cn(
            "mt-1 text-xs leading-snug",
            d.configured ? "text-muted-foreground" : "text-muted-foreground"
          )}
        >
          {d.configured ? d.summary : "Выберите действие"}
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
      <Handle
        type="source"
        position={Position.Bottom}
        title="Выход: потяните к верхней точке следующего шага"
        className="!pointer-events-auto !z-30 !h-4 !w-4 !border-2 !border-[hsl(var(--brand-purple))] !bg-white"
      />
    </div>
  );
}

export const ActionNode = memo(ActionNodeInner);
