'use client';

import { useTranslations } from 'next-intl';
import type { ChartPayload } from '@talim/types';
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent-secondary))',
  'hsl(var(--info))',
  'hsl(var(--success))',
];

function buildRows(payload: ChartPayload) {
  return payload.labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    for (const series of payload.series) {
      row[series.name] = series.data[i] ?? 0;
    }
    return row;
  });
}

export function TutorChart({ payload }: { payload: ChartPayload }) {
  const t = useTranslations('chat');
  const rows = buildRows(payload);
  const ChartComponent =
    payload.type === 'bar' ? BarChart : payload.type === 'area' ? AreaChart : LineChart;

  return (
    <div className="my-2 rounded-xl border border-border bg-card p-3" aria-label={t('chartLabel')}>
      {payload.title && (
        <p className="mb-2 font-label text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {payload.title}
        </p>
      )}
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} label={payload.xLabel ? { value: payload.xLabel, position: 'insideBottom', offset: -4 } : undefined} />
            <YAxis tick={{ fontSize: 10 }} label={payload.yLabel ? { value: payload.yLabel, angle: -90, position: 'insideLeft' } : undefined} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {payload.series.map((s, idx) => {
              const color = COLORS[idx % COLORS.length];
              if (payload.type === 'bar') {
                return <Bar key={s.name} dataKey={s.name} fill={color} radius={[4, 4, 0, 0]} />;
              }
              if (payload.type === 'area') {
                return <Area key={s.name} type="monotone" dataKey={s.name} stroke={color} fill={color} fillOpacity={0.25} />;
              }
              return <Line key={s.name} type="monotone" dataKey={s.name} stroke={color} strokeWidth={2} dot={{ r: 3 }} />;
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
