// @vitest-environment jsdom
/**
 * @file ActivityHeatmap.test.tsx
 * @description Renders the heatmap with empty + populated activity logs and
 * verifies cell counts, bucketing, and the empty-state fallback.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import ActivityHeatmap from '../components/ActivityHeatmap';
import { toDateKey } from '../utils/analytics';

// Local-time constructor so toDateKey() is TZ-agnostic across CI + dev.
const FIXED_TODAY = new Date(2026, 4, 27, 12, 0, 0);

describe('ActivityHeatmap', () => {
  it('renders the empty-state fallback when no activity exists', () => {
    render(<ActivityHeatmap activity={{}} today={FIXED_TODAY} />);
    expect(screen.getByText(/No activity yet/i)).toBeTruthy();
  });

  it('renders a 7 × N grid when activity exists', () => {
    const activity = {
      [toDateKey(FIXED_TODAY)]: { reviews: 5, learned: 2 },
    };
    const { container } = render(
      <ActivityHeatmap activity={activity} weeks={13} today={FIXED_TODAY} />
    );
    const cells = container.querySelectorAll('[data-date]');
    expect(cells.length).toBe(13 * 7); // 91 day cells
  });

  it('shows the correct active-day count and totals in the header', () => {
    const activity = {
      [toDateKey(FIXED_TODAY)]: { reviews: 5, learned: 2 },
      [toDateKey(new Date(2026, 4, 26, 12, 0, 0))]: { reviews: 3, learned: 1 },
      [toDateKey(new Date(2026, 4, 25, 12, 0, 0))]: { reviews: 0, learned: 4 },
    };
    render(<ActivityHeatmap activity={activity} today={FIXED_TODAY} />);
    expect(screen.getByTestId('heatmap-active-days').textContent).toMatch(/3 active days/);
    expect(screen.getByTestId('heatmap-total-learned').textContent).toBe('7 learned');
    expect(screen.getByTestId('heatmap-total-reviews').textContent).toBe('8 reviews');
  });

  it('places the most-recent day in the last cell (rightmost column, last row)', () => {
    const todayKey = toDateKey(FIXED_TODAY);
    const activity = { [todayKey]: { reviews: 1, learned: 0 } };
    const { container } = render(
      <ActivityHeatmap activity={activity} weeks={13} today={FIXED_TODAY} />
    );
    const cells = Array.from(container.querySelectorAll('[data-date]'));
    const lastCell = cells[cells.length - 1] as HTMLElement;
    expect(lastCell.getAttribute('data-date')).toBe(todayKey);
    expect(lastCell.getAttribute('data-total')).toBe('1');
  });

  it('ignores activity entries outside the visible window', () => {
    const ancient = '2020-01-01';
    const activity = {
      [ancient]: { reviews: 100, learned: 50 },
      [toDateKey(FIXED_TODAY)]: { reviews: 1, learned: 0 },
    };
    render(<ActivityHeatmap activity={activity} weeks={13} today={FIXED_TODAY} />);
    expect(screen.getByTestId('heatmap-active-days').textContent).toMatch(/^1 active day$/);
  });

  it('assigns a more intense color bucket as daily total grows', () => {
    const today = toDateKey(FIXED_TODAY);
    const { container, rerender } = render(
      <ActivityHeatmap
        activity={{ [today]: { reviews: 1, learned: 0 } }}
        today={FIXED_TODAY}
      />
    );
    const lowCell = container.querySelector(`[data-date="${today}"]`)!;
    const lowClass = lowCell.className;

    rerender(
      <ActivityHeatmap
        activity={{ [today]: { reviews: 15, learned: 5 } }}
        today={FIXED_TODAY}
      />
    );
    const highCell = container.querySelector(`[data-date="${today}"]`)!;
    const highClass = highCell.className;

    // Buckets are different classes for 1 vs 20 activity.
    expect(lowClass).not.toBe(highClass);
  });
});
