import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function WorkflowStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-normal",
        active
          ? "border border-success/30 bg-success/15 text-success"
          : "bg-muted text-muted-foreground"
      )}
    >
      {active ? "Опубликован" : "Черновик"}
    </Badge>
  );
}
