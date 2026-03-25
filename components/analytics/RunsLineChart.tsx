"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function RunsLineChart({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  return (
    <div className="h-64 w-full rounded-xl border bg-card p-4">
      <p className="mb-2 text-sm font-medium">Запуски по времени</p>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip
            isAnimationActive={false}
            formatter={(value) => [
              `${value == null || value === "" ? "—" : Number(value)} запусков`,
              "",
            ]}
            labelFormatter={(label) => `Дата: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#FF4A00"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
