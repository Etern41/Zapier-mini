"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Zap, Clock, BarChart2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/workflows", label: "Workflows", Icon: Zap },
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
    <aside className="relative flex w-56 shrink-0 flex-col bg-[#111827] text-white">
      <div className="flex h-12 items-center gap-2 px-4">
        <Zap className="size-5 text-violet-400" aria-hidden />
        <span className="text-lg font-bold text-white">AutoFlow</span>
      </div>
      <nav className="mt-6 px-2">
        <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-widest text-slate-500">
          Навигация
        </p>
        <ul className="space-y-0.5">
          {nav.map(({ href, label, Icon }) => {
            const active =
              href === "/workflows"
                ? pathname === "/workflows" || pathname.startsWith("/workflows/")
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-lg px-2 text-sm transition-colors",
                    active
                      ? "border-l-2 border-violet-400 bg-white/10 text-white"
                      : "border-l-2 border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 border-t border-white/10 p-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-medium text-white">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-200">{userName}</p>
          {userEmail ? (
            <p className="truncate text-xs text-slate-500">{userEmail}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 text-slate-400 hover:bg-white/10 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Выйти"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
