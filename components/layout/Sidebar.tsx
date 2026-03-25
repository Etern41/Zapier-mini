"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Zap, Clock, BarChart2, LogOut, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/workflows", label: "Zaps", Icon: Zap },
  { href: "/history", label: "История запусков", Icon: Clock },
  { href: "/analytics", label: "Аналитика", Icon: BarChart2 },
];

export function Sidebar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const initials = userName
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="relative flex w-[220px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-[52px] items-center gap-2 border-b border-border px-4">
        <Zap className="size-5 shrink-0 text-[hsl(var(--primary))]" aria-hidden />
        <span className="text-lg font-bold text-foreground">AutoFlow</span>
      </div>
      <nav className="mt-4 px-2">
        <p className="section-label mb-2 px-2">Навигация</p>
        <ul className="space-y-0.5">
          {nav.map(({ href, label, Icon }) => {
            const active =
              href === "/workflows"
                ? pathname === "/workflows" ||
                  (pathname.startsWith("/workflows/") &&
                    !pathname.includes("/runs"))
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
                    active
                      ? "border-l-2 border-primary bg-[hsl(var(--sidebar-active-bg))] pl-[6px] font-medium text-[hsl(var(--primary))]"
                      : "border-l-2 border-transparent text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto border-t border-border px-2 py-3">
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mb-2 flex h-9 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          )}
        >
          <BookOpen className="size-4 shrink-0" />
          API документация
        </a>
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{userName}</p>
            {userEmail ? (
              <p className="truncate text-xs text-muted-foreground">
                {userEmail}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 shrink-0 text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Выйти"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
