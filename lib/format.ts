export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyPrecise(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(iso: string): string {
  // iso is a date string like 2026-06-15
  const [y, m, d] = iso.split("T")[0].split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  return `${formatDateShort(checkIn)} – ${formatDateShort(checkOut)}`
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn.split("T")[0])
  const b = new Date(checkOut.split("T")[0])
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000))
}

/** Local YYYY-MM-DD for the current date (no timezone drift). */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Build an array of N consecutive ISO dates starting at startISO. */
export function dateRange(startISO: string, days: number): string[] {
  const [y, m, d] = startISO.split("T")[0].split("-").map(Number)
  const out: string[] = []
  for (let i = 0; i < days; i++) {
    const dt = new Date(y, m - 1, d + i)
    out.push(
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`,
    )
  }
  return out
}

/** Whole-day difference (b - a) in days, using date-only parsing. */
export function dayDiff(aISO: string, bISO: string): number {
  const a = new Date(aISO.split("T")[0] + "T00:00:00")
  const b = new Date(bISO.split("T")[0] + "T00:00:00")
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

export function weekday(iso: string): string {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" })
}

export function dayOfMonth(iso: string): number {
  return Number(iso.split("T")[0].split("-")[2])
}
