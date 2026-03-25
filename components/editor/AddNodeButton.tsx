"use client";

import { Plus } from "lucide-react";

export function AddNodeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full border-2 border-[#7C3AED] bg-white text-[#7C3AED] shadow-sm transition-all hover:border-[#7C3AED] hover:bg-[#7C3AED] hover:text-white"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Добавить шаг"
    >
      <Plus className="size-4" />
    </button>
  );
}
