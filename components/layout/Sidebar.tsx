"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Zap, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { dashboardDocsItem, dashboardNavItems } from "@/lib/dashboard-nav";

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/workflows") {
    return (
      pathname === "/workflows" ||
      (pathname.startsWith("/workflows/") && !pathname.includes("/runs"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

  const DocsIcon = dashboardDocsItem.Icon;

  return (
    <aside className="relative hidden w-[220px] shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-[52px] items-center gap-2 border-b border-border px-4">
        <Zap className="size-5 shrink-0 text-[hsl(var(--primary))]" aria-hidden />
        <span className="text-lg font-bold text-foreground">AutoFlow</span>
      </div>
      <nav className="mt-4 px-2">
        <p className="section-label mb-2 px-2">Навигация</p>
        <ul className="space-y-0.5">
          {dashboardNavItems.map(({ href, label, Icon }) => {
            const active = isNavActive(pathname, href);
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
          href={dashboardDocsItem.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mb-2 flex h-9 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          )}
        >
          <DocsIcon className="size-4 shrink-0" />
          {dashboardDocsItem.label}
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
