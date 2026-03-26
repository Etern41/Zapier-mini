"use client";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { MobileNav } from "@/components/layout/MobileNav";

export function Header({
  title,
  email,
  userName,
}: {
  title: string;
  email?: string | null;
  userName: string;
}) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border bg-card px-3 sm:gap-3 sm:px-4">
      <MobileNav userName={userName} userEmail={email} />
      <span className="min-w-0 flex-1 truncate page-title">{title}</span>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        {email ? (
          <span className="hidden max-w-[140px] truncate text-xs text-muted-foreground sm:inline md:max-w-[220px]">
            {email}
          </span>
        ) : null}
      </div>
    </header>
  );
}
