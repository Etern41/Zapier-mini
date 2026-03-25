"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddNodeButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-8 rounded-full border-2 border-[#7C3AED] bg-white text-[#7C3AED] shadow-sm hover:border-[#7C3AED] hover:bg-[#7C3AED] hover:text-white"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Добавить шаг"
    >
      <Plus className="size-4" />
    </Button>
  );
}
