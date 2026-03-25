"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function WorkflowBarChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const short = data.map((d) => ({
    ...d,
    label: d.name.length > 14 ? `${d.name.slice(0, 12)}…` : d.name,
  }));
  return (
    <div className="h-64 w-full rounded-xl border bg-card p-4">
      <p className="mb-2 text-sm font-medium">Запуски по воркфлоу</p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={short}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) => [
              value == null ? "—" : Number(value),
              "Запуски",
            ]}
            labelFormatter={(label) => `Воркфлоу: ${label}`}
          />
          <Bar dataKey="count" fill="#FF4A00" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
