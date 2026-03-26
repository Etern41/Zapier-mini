import { Zap, Clock, BarChart2, BookOpen, type LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

export const dashboardNavItems: DashboardNavItem[] = [
  { href: "/workflows", label: "Zaps", Icon: Zap },
  { href: "/history", label: "История запусков", Icon: Clock },
  { href: "/analytics", label: "Аналитика", Icon: BarChart2 },
];

export const dashboardDocsItem = {
  href: "/api/docs",
  label: "API документация",
  Icon: BookOpen,
} as const;
