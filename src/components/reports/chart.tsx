"use client";

import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, startOfDay, eachDayOfInterval, subDays } from "date-fns";

interface TimelineItem {
  createdAt: string;
  resolvedAt: string | null;
  status: string;
}

export function ReportsChart({ timeline }: { timeline: TimelineItem[] }) {
  const days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const chartData = days.map((day) => {
    const dayStart = startOfDay(day);
    const dayStr = format(day, "dd/MM");
    const created = timeline.filter(
      (t) => format(new Date(t.createdAt), "yyyy-MM-dd") === format(dayStart, "yyyy-MM-dd")
    ).length;
    const resolved = timeline.filter(
      (t) =>
        t.resolvedAt &&
        format(new Date(t.resolvedAt), "yyyy-MM-dd") === format(dayStart, "yyyy-MM-dd")
    ).length;
    return { day: dayStr, criados: created, resolvidos: resolved };
  });

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Volume diário (30 dias)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="criados" fill="#3b82f6" name="Criados" radius={[4, 4, 0, 0]} />
          <Bar dataKey="resolvidos" fill="#10b981" name="Resolvidos" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
