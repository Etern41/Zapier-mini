import { Skeleton } from "@/components/ui/skeleton";

export default function WorkflowRunsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto bg-background p-3 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-5 gap-2 border-b bg-muted/40 px-4 py-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
