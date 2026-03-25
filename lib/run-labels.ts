export function triggerLabelRu(trigger: string): string {
  const t = trigger.toLowerCase();
  if (t === "webhook" || t === "manual") return "Webhook";
  if (t === "schedule" || t === "cron") return "Расписание";
  if (t === "email") return "Email";
  if (t === "test") return "Тест";
  return trigger;
}

export function stepStatusLabelRu(status: string): string {
  switch (status) {
    case "PENDING":
      return "Ожидание";
    case "RUNNING":
      return "Выполняется";
    case "SUCCESS":
      return "Успех";
    case "FAILED":
      return "Ошибка";
    case "SKIPPED":
      return "Пропущено";
    default:
      return status;
  }
}

export function runStatusLabelRu(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "Успех";
    case "FAILED":
      return "Ошибка";
    case "RUNNING":
      return "Выполняется";
    case "PAUSED":
      return "Пауза";
    default:
      return status;
  }
}

export function formatRunDuration(
  startedAt: string,
  finishedAt?: string | null,
  status?: string
): string {
  if (status === "RUNNING") return "…";
  if (!finishedAt) return "—";
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} мс`;
  return `${(ms / 1000).toFixed(1)} с`;
}
