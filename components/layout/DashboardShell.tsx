"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";

function titleForPath(pathname: string): string {
  if (pathname === "/workflows") return "Workflows";
  if (pathname.startsWith("/workflows/") && pathname.includes("/runs")) {
    return "История запусков";
  }
  if (pathname.startsWith("/workflows/")) return "Редактор workflow";
  if (pathname === "/history") return "История запусков";
  if (pathname === "/analytics") return "Аналитика";
  return "AutoFlow";
}

export function DashboardShell({
  userEmail,
  children,
}: {
  userEmail?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <>
      <Header title={titleForPath(pathname)} email={userEmail} />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </>
  );
}
