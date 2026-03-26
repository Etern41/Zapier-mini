import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const name = session?.user?.name ?? "User";
  const email = session?.user?.email;

  return (
    <div className="flex h-dvh min-h-0">
      <Sidebar userName={name} userEmail={email} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardShell userName={name} userEmail={email}>
          {children}
        </DashboardShell>
      </div>
    </div>
  );
}
