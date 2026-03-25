import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WorkflowStatusBadge } from "@/components/workflows/WorkflowStatusBadge";

export function WorkflowCard({
  id,
  name,
  description,
  isActive,
}: {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}) {
  return (
    <Link href={`/workflows/${id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{name}</CardTitle>
            {description ? (
              <CardDescription className="line-clamp-2">
                {description}
              </CardDescription>
            ) : null}
          </div>
          <WorkflowStatusBadge active={isActive} />
        </CardHeader>
      </Card>
    </Link>
  );
}
