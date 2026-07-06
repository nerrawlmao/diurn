/**
 * All date keys are local-time 'YYYY-MM-DD' strings. The diary is about
 * the user's day as they lived it, so local time is the source of truth.
 */

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

/** Parse a 'YYYY-MM-DD' key into a local Date at midnight. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** e.g. "Sunday, July 5, 2026" */
export function formatFullDate(key: string): string {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** e.g. "July 2026" */
export function formatMonthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

/** e.g. "July 5, 2026 at 9:41 PM" for the sealed-at timestamp. */
export function formatSealedAt(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' at ' + d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}
