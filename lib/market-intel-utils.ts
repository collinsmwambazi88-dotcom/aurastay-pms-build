import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns"

/**
 * Variable-interval sampling for market scraping. Near-term dates are sampled
 * densely (where pricing volatility and booking demand are highest) and far-out
 * dates sparsely, to keep the scrape budget bounded.
 *
 * Cadence by horizon (days from today):
 *   0–14   -> every 1 day
 *   14–30  -> every 7 days
 *   30–90  -> every 14 days
 *   90+    -> every 30 days
 *
 * @param horizonDays how far ahead to sample (default 365 days)
 * @param from the reference "today" (defaults to now); used for testing
 * @returns sorted, de-duplicated `yyyy-MM-dd` date strings
 */
export function generateTargetDates(horizonDays = 365, from: Date = new Date()): string[] {
  const today = startOfDay(from)
  const dates: string[] = []

  let cursor = today
  while (differenceInCalendarDays(cursor, today) <= horizonDays) {
    const offset = differenceInCalendarDays(cursor, today)
    dates.push(format(cursor, "yyyy-MM-dd"))
    cursor = addDays(cursor, intervalForOffset(offset))
  }

  // De-duplicate (interval boundaries can overlap) and sort ascending.
  return Array.from(new Set(dates)).sort()
}

/** Number of days to advance given how far out we currently are. */
function intervalForOffset(offsetDays: number): number {
  if (offsetDays < 14) return 1
  if (offsetDays < 30) return 7
  if (offsetDays < 90) return 14
  return 30
}
