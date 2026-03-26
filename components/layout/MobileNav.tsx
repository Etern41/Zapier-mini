"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, Zap, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
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

export function MobileNav({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = userName
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const DocsIcon = dashboardDocsItem.Icon;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 shrink-0 md:hidden"
        )}
        aria-label="Открыть меню"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[min(280px,88vw)] flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Zap className="size-5 text-[hsl(var(--primary))]" aria-hidden />
            AutoFlow
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="section-label mb-2 px-2">Навигация</p>
          <ul className="space-y-0.5">
            {dashboardNavItems.map(({ href, label, Icon }) => {
              const active = isNavActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-10 items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
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
        <div className="border-t border-border px-2 py-3">
          <a
            href={dashboardDocsItem.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mb-3 flex h-10 items-center gap-2.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
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
      </SheetContent>
    </Sheet>
  );
}
