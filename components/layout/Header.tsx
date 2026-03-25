"use client";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header({
  title,
  email,
}: {
  title: string;
  email?: string | null;
}) {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <span className="page-title">{title}</span>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {email ? (
          <span className="text-xs text-muted-foreground">{email}</span>
        ) : null}
      </div>
    </header>
  );
}
