/**
 * @file ActivityHeatmap.tsx
 * @description GitHub-style 13-week activity heatmap driven by
 * UserStats.dailyActivity. Shows last 91 days (7 rows × 13 cols).
 * Color intensity reflects total daily activity (reviews + learned).
 */

import React, { useMemo } from 'react';
import type { DailyActivityEntry } from '../utils/analytics';
import { toDateKey } from '../utils/analytics';

interface ActivityHeatmapProps {
  activity: Record<string, DailyActivityEntry>;
  /** Number of weeks to show. Defaults to 13 (~3 months). */
  weeks?: number;
  /** Override "today" for tests. */
  today?: Date;
}

// Color buckets keyed by total daily activity (learned + reviews).
// Tuned for an exam aspirant: 10 cards/day is the default dailyGoal,
// so 10+ should look meaningfully different from 1-3.
function bucketClass(total: number): string {
  if (total === 0) return 'bg-slate-100';
  if (total < 4) return 'bg-indigo-200';
  if (total < 8) return 'bg-indigo-400';
  if (total < 12) return 'bg-indigo-500';
  return 'bg-indigo-700';
}

export default function ActivityHeatmap({
  activity,
  weeks = 13,
  today = new Date(),
}: ActivityHeatmapProps) {
  // Build a list of dates ending today, oldest first, laid out so the
  // RIGHTMOST column is the current week and rows are weekdays.
  const cells = useMemo(() => {
    const totalDays = weeks * 7;
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (totalDays - 1));
    const out: Array<{ key: string; date: Date; total: number; entry: DailyActivityEntry }> = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toDateKey(d);
      const entry = activity[key] || { reviews: 0, learned: 0 };
      out.push({ key, date: d, total: entry.reviews + entry.learned, entry });
    }
    return out;
  }, [activity, weeks, today]);

  // Aggregate stats for the header line.
  const summary = useMemo(() => {
    let activeDays = 0;
    let totalReviews = 0;
    let totalLearned = 0;
    for (const c of cells) {
      if (c.total > 0) activeDays++;
      totalReviews += c.entry.reviews;
      totalLearned += c.entry.learned;
    }
    return { activeDays, totalReviews, totalLearned };
  }, [cells]);

  // Reshape into weeks (columns) of 7 days each, then transpose so the
  // grid renders weekday-rows × week-columns.
  const grid: typeof cells[] = useMemo(() => {
    const cols: typeof cells[] = [];
    for (let w = 0; w < weeks; w++) {
      cols.push(cells.slice(w * 7, w * 7 + 7));
    }
    return cols;
  }, [cells, weeks]);

  if (summary.activeDays === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-sm font-medium border-dashed p-4">
        <p className="mb-1 text-center font-bold text-slate-600">No activity yet</p>
        <p className="text-xs text-slate-400 text-center">
          Start learning words to light up this heatmap.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="activity-heatmap">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
        <span className="flex gap-2">
          <span data-testid="heatmap-active-days">
            <span className="font-bold text-slate-700">{summary.activeDays}</span> active day{summary.activeDays === 1 ? '' : 's'}
          </span>
          <span>·</span>
          <span data-testid="heatmap-total-learned">{summary.totalLearned} learned</span>
          <span>·</span>
          <span data-testid="heatmap-total-reviews">{summary.totalReviews} reviews</span>
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Last {weeks * 7} days</span>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {grid.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((cell) => (
              <div
                key={cell.key}
                data-date={cell.key}
                data-total={cell.total}
                title={`${cell.key} — ${cell.entry.learned} learned · ${cell.entry.reviews} reviews`}
                className={`w-3 h-3 rounded-sm ${bucketClass(cell.total)}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400">
        <span>Less</span>
        <span className="w-3 h-3 rounded-sm bg-slate-100" />
        <span className="w-3 h-3 rounded-sm bg-indigo-200" />
        <span className="w-3 h-3 rounded-sm bg-indigo-400" />
        <span className="w-3 h-3 rounded-sm bg-indigo-500" />
        <span className="w-3 h-3 rounded-sm bg-indigo-700" />
        <span>More</span>
      </div>
    </div>
  );
}
