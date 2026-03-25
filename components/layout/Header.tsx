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
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {email ? (
          <span className="text-xs text-muted-foreground">{email}</span>
        ) : null}
      </div>
    </header>
  );
}
