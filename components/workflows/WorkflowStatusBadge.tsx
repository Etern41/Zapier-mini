import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function WorkflowStatusBadge({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      title={
        active
          ? "Триггеры включены: входящие webhook, расписание и другие события ставят запуски в очередь."
          : "Триггеры выключены: автоматические запуски не выполняются; в редакторе доступен ручной тест."
      }
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-normal",
        active
          ? "border border-success/30 bg-success/15 text-success"
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      {active ? "Опубликован" : "Черновик"}
    </Badge>
  );
}
