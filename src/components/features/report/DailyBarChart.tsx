'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DailyEntry { date: string; amount: number }
interface Props {
  data: DailyEntry[];
  year: number;
  month: number;
}

const daysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

export default function DailyBarChart({ data, year, month }: Props) {
  const totalDays = daysInMonth(year, month);
  const amountMap = new Map(data.map((d) => [d.date, d.amount]));

  const chartData = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { day, amount: amountMap.get(date) ?? 0 };
  });

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="20%">
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: 'rgba(80,80,110,0.5)' }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'rgba(80,80,110,0.5)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
        />
        <Tooltip
          formatter={(value) => [`¥${Number(value).toLocaleString()}`, '']}
          labelFormatter={(label) => `${label}일`}
          contentStyle={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.9)',
            borderRadius: 10,
            fontSize: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
          cursor={{ fill: 'rgba(139,92,246,0.06)' }}
        />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.amount > maxAmount * 0.7
                ? 'rgba(139,92,246,0.75)'
                : entry.amount > 0
                  ? 'rgba(139,92,246,0.42)'
                  : 'rgba(139,92,246,0.08)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
