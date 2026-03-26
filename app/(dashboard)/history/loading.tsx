import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto bg-background p-3 sm:p-6">
      <Skeleton className="h-9 w-64 max-w-full" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 min-w-[200px] flex-1 max-w-md" />
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid grid-cols-6 gap-2 border-b bg-muted/40 px-4 py-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
