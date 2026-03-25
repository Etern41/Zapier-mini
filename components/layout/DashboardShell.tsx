"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";

function titleForPath(pathname: string): string {
  if (pathname === "/workflows") return "Zaps";
  if (pathname.startsWith("/workflows/") && pathname.includes("/runs")) {
    return "История запусков";
  }
  if (pathname.startsWith("/workflows/")) return "";
  if (pathname === "/history") return "История запусков";
  if (pathname === "/analytics") return "Аналитика";
  return "AutoFlow";
}

/** Full editor at /workflows/[id] — top bar is inside WorkflowEditor */
function isWorkflowEditorPath(pathname: string): boolean {
  const m = /^\/workflows\/([^/]+)$/.exec(pathname);
  return !!m && m[1] !== "";
}

export function DashboardShell({
  userEmail,
  children,
}: {
  userEmail?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideHeader = isWorkflowEditorPath(pathname);
  const title = titleForPath(pathname);

  return (
    <>
      {!hideHeader ? (
        <Header title={title || "AutoFlow"} email={userEmail} />
      ) : null}
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </>
  );
}
