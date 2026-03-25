"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function FailuresTable({
  rows,
}: {
  rows: {
    id: string;
    workflowId: string;
    workflowName: string;
    error: string | null;
    startedAt: string;
  }[];
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const retry = async (workflowId: string, runId: string) => {
    setBusy(runId);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(j.error ?? "Не удалось повторить запуск");
        return;
      }
      toast.success("Новый запуск поставлен в очередь");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card-zapier">
      <p className="mb-3 text-sm font-medium text-foreground">
        Недавние ошибки
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ошибок нет</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="section-label pb-2 font-medium">Воркфлоу</th>
                <th className="section-label pb-2 font-medium">
                  Сообщение об ошибке
                </th>
                <th className="section-label pb-2 font-medium">Время</th>
                <th className="section-label pb-2 text-right font-medium">
                  Действие
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-2 font-medium text-foreground">
                    {r.workflowName}
                  </td>
                  <td className="max-w-xs py-2 pr-2 text-xs text-destructive">
                    {r.error ?? "Неизвестная ошибка"}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-2 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.startedAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy === r.id}
                      onClick={() => void retry(r.workflowId, r.id)}
                    >
                      {busy === r.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Повторить"
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
