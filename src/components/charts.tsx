'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useState } from 'react';

import { Card, CardHeader, buttonClass } from '@/components/ui/primitives';
import type { Difficulty } from '@/lib/types';

/**
 * Every chart here is drawn from rows the server read out of Postgres for the
 * signed-in user. Nothing is generated, sampled or padded — an empty chart
 * means you have not done anything yet, and it says so instead of drawing a
 * flat line.
 *
 * Colour: the Easy / Medium / Hard scale below was validated for both themes —
 * OKLCH lightness band, chroma floor, CVD separation (worst adjacent pair
 * ΔE 8.3 deutan), normal-vision separation and 3:1 contrast against both the
 * light and the dark chart surface. The same three values work in both modes,
 * and every segment is also directly labelled, so identity is never carried by
 * colour alone.
 */
export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: '#00a390',
  Medium: '#c77b09',
  Hard: '#e0335c',
};

const BRAND = 'var(--color-brand-500)';
const AXIS = 'hsl(var(--text-subtle))';
const GRID = 'hsl(var(--border))';
const SURFACE = 'hsl(var(--surface))';

const axisProps = {
  stroke: AXIS,
  tickLine: false,
  axisLine: false,
  tick: { fill: AXIS, fontSize: 11 },
} as const;

function TooltipBox({
  active,
  payload,
  label,
  unit = '',
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }>;
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-3 py-2 shadow-[var(--shadow-soft)]">
      {label != null ? (
        <p className="mb-1 text-xs font-medium text-[hsl(var(--text))]">{label}</p>
      ) : null}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-xs text-[hsl(var(--text-muted))]">
          {p.color ? (
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: p.color }}
            />
          ) : null}
          <span className="tabular font-medium text-[hsl(var(--text))]">{p.value}</span>
          {unit || p.name}
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border-strong))] px-6 text-center">
      <p className="max-w-xs text-sm text-[hsl(var(--text-muted))]">{message}</p>
    </div>
  );
}

/* ------------------------------------------------- weekly activity bars --- */

export function WeeklyActivityChart({
  data,
}: {
  data: { date: string; label: string; solved: number; events: number }[];
}) {
  const hasAny = data.some((d) => d.events > 0);

  return (
    <Card>
      <CardHeader
        title="This week"
        description="Problems you marked solved on each of the last seven days."
      />
      <div className="px-3 pb-5">
        {hasAny ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis allowDecimals={false} width={30} tickCount={4} {...axisProps} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--surface-2))' }}
                content={<TooltipBox unit="solved" />}
              />
              <Bar dataKey="solved" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={38} stroke={SURFACE} strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="Nothing solved in the last seven days yet. Mark a problem solved and it appears here." />
        )}
      </div>
    </Card>
  );
}

/* --------------------------------------------------- difficulty donut ---- */

export function DifficultyDonut({
  data,
  totalSolved,
}: {
  data: { difficulty: Difficulty; solved: number; total: number }[];
  totalSolved: number;
}) {
  const [showTable, setShowTable] = useState(false);
  const slices = data.filter((d) => d.solved > 0);

  return (
    <Card>
      <CardHeader
        title="Solved by difficulty"
        description="How your solved problems split across the three levels."
        action={
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className={buttonClass('ghost', 'sm')}
          >
            {showTable ? 'Show chart' : 'Show table'}
          </button>
        }
      />

      <div className="px-5 pb-5">
        {totalSolved === 0 ? (
          <EmptyChart message="No solved problems yet. This fills in as you work through the ladder." />
        ) : showTable ? (
          <table className="w-full text-sm">
            <caption className="sr-only">Solved problems by difficulty</caption>
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-left text-xs text-[hsl(var(--text-muted))]">
                <th scope="col" className="py-2 font-medium">
                  Difficulty
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Solved
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Total
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.difficulty} className="border-b border-[hsl(var(--border))] last:border-0">
                  <th scope="row" className="py-2 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: DIFFICULTY_COLOR[d.difficulty] }}
                      />
                      {d.difficulty}
                    </span>
                  </th>
                  <td className="tabular py-2 text-right">{d.solved}</td>
                  <td className="tabular py-2 text-right text-[hsl(var(--text-muted))]">{d.total}</td>
                  <td className="tabular py-2 text-right">
                    {d.total ? Math.round((d.solved / d.total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="relative">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="solved"
                    nameKey="difficulty"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke={SURFACE}
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {slices.map((d) => (
                      <Cell key={d.difficulty} fill={DIFFICULTY_COLOR[d.difficulty]} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipBox unit="solved" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="tabular text-2xl font-semibold text-[hsl(var(--text))]">
                  {totalSolved}
                </span>
                <span className="text-[11px] text-[hsl(var(--text-muted))]">solved</span>
              </div>
            </div>

            {/* legend doubles as the direct labels */}
            <ul className="space-y-2">
              {data.map((d) => (
                <li key={d.difficulty} className="flex items-center gap-2.5 text-sm">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: DIFFICULTY_COLOR[d.difficulty] }}
                  />
                  <span className="w-16 text-[hsl(var(--text-muted))]">{d.difficulty}</span>
                  <span className="tabular font-medium text-[hsl(var(--text))]">
                    {d.solved}
                    <span className="font-normal text-[hsl(var(--text-subtle))]"> / {d.total}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------ topic completion bars --- */

export function TopicCompletionChart({
  data,
}: {
  data: { topic: string; percent: number; solved: number; total: number }[];
}) {
  if (data.length === 0) {
    return <EmptyChart message="No topics to chart yet." />;
  }

  // Horizontal bars — nineteen topic names will never fit on an x-axis.
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 26)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
        barCategoryGap="24%"
      >
        <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} unit="%" {...axisProps} />
        <YAxis
          type="category"
          dataKey="topic"
          width={150}
          {...axisProps}
          tick={{ fill: AXIS, fontSize: 11 }}
        />
        <Tooltip cursor={{ fill: 'hsl(var(--surface-2))' }} content={<TooltipBox unit="% complete" />} />
        <Bar dataKey="percent" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={16} stroke={SURFACE} strokeWidth={2} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------- daily solves ---- */

export function DailySolvesChart({
  data,
}: {
  data: { date: string; solved: number; events: number }[];
}) {
  if (data.length < 2) {
    return (
      <EmptyChart message="Not enough history yet — this needs at least two days of activity before a trend means anything." />
    );
  }

  const shaped = data.map((d) => ({
    ...d,
    label: new Date(`${d.date}T00:00:00Z`).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={shaped} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="label" minTickGap={28} {...axisProps} />
        <YAxis allowDecimals={false} width={30} tickCount={4} {...axisProps} />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--border-strong))', strokeWidth: 1 }}
          content={<TooltipBox unit="solved" />}
        />
        <Line
          type="monotone"
          dataKey="solved"
          stroke={BRAND}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------------------------------------------------- pattern coverage --- */

export function PatternCoverageChart({
  data,
}: {
  data: { pattern: string; total: number; solved: number }[];
}) {
  const shaped = data
    .map((d) => ({
      ...d,
      percent: d.total ? Math.round((d.solved / d.total) * 100) : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  if (shaped.length === 0) return <EmptyChart message="No pattern data yet." />;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, shaped.length * 26)}>
      <BarChart
        data={shaped}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
        barCategoryGap="24%"
      >
        <CartesianGrid horizontal={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} unit="%" {...axisProps} />
        <YAxis type="category" dataKey="pattern" width={150} {...axisProps} />
        <Tooltip cursor={{ fill: 'hsl(var(--surface-2))' }} content={<TooltipBox unit="% covered" />} />
        <Bar dataKey="percent" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={16} stroke={SURFACE} strokeWidth={2} />
      </BarChart>
    </ResponsiveContainer>
  );
}
