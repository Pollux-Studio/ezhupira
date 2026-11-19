"use client";

import { useMemo, useState } from "react";
import { cx } from "@/components/ui";
import { inr } from "@/lib/format";

type Day = { date: string; revenue: number; orders: number };

const dayLabel = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${iso}T00:00:00`));

/** Last 30 days, oldest first, with empty days filled in (IST calendar days). */
function fillDays(daily: Day[]): Day[] {
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return byDate.get(key) ?? { date: key, revenue: 0, orders: 0 };
  });
}

/** Nice round top for the y-axis. */
function niceMax(v: number) {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p / (v / p > 5 ? 2 : 1)) * p * (v / p > 5 ? 2 : 1);
}

/**
 * Daily revenue, last 30 days: one series (no legend; the title names it), thin bars with
 * rounded tops on a baseline, a recessive grid, and a tooltip per bar. Table view alongside.
 */
export function RevenueChart({ daily }: { daily: Day[] }) {
  const days = useMemo(() => fillDays(daily), [daily]);
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = niceMax(Math.max(...days.map((d) => d.revenue)));
  const total = days.reduce((s, d) => s + d.revenue, 0);

  const W = 720;
  const H = 220;
  const pad = { top: 12, right: 8, bottom: 26, left: 56 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const slot = plotW / days.length;
  const barW = Math.max(4, slot - 4); // ≥2px surface gap each side
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-semibold">Revenue, last 30 days</h2>
          <p className="text-sm text-muted">{inr(total)} from paid orders</p>
        </div>
        <button type="button" onClick={() => setAsTable((t) => !t)} className="text-sm text-muted underline hover:text-ink">
          {asTable ? "Show chart" : "Show as table"}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-72 overflow-auto rounded-md border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface text-left text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Day</th>
                <th className="px-3 py-2 text-right font-medium">Orders</th>
                <th className="px-3 py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <td className="px-3 py-1.5">{dayLabel(d.date)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{d.orders}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{inr(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Daily revenue for the last 30 days, ${inr(total)} in total`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
                <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted)">
                  {inr(t)}
                </text>
              </g>
            ))}
            {days.map((d, i) => {
              const x = pad.left + i * slot + (slot - barW) / 2;
              const h = Math.max(0, pad.top + plotH - y(d.revenue));
              const r = Math.min(4, barW / 2, h);
              return (
                <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  {/* Hit target: the whole column, bigger than the bar */}
                  <rect x={pad.left + i * slot} y={pad.top} width={slot} height={plotH} fill="transparent" />
                  {h > 0 && (
                    <path
                      d={`M${x},${pad.top + plotH} v${-(h - r)} q0,${-r} ${r},${-r} h${barW - 2 * r} q${r},0 ${r},${r} v${h - r} z`}
                      fill="var(--chart)"
                      opacity={hover === null || hover === i ? 1 : 0.45}
                    />
                  )}
                  {i % 7 === 0 && (
                    <text x={pad.left + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
                      {dayLabel(d.date)}
                    </text>
                  )}
                </g>
              );
            })}
            <line x1={pad.left} x2={W - pad.right} y1={pad.top + plotH} y2={pad.top + plotH} stroke="var(--muted)" strokeWidth={1} />
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-sm"
              style={{ left: `${((pad.left + hover * slot + slot / 2) / W) * 100}%` }}
            >
              <p className="font-medium">{dayLabel(days[hover]!.date)}</p>
              <p className="tabular-nums">{inr(days[hover]!.revenue)}</p>
              <p className={cx("text-muted tabular-nums")}>
                {days[hover]!.orders} order{days[hover]!.orders === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
