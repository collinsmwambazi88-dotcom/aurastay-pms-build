import { addDays, format, parseISO } from "date-fns"

export interface ScrapedHotel {
  name: string
  price: number
}

interface ScrapingBeeRawHotel {
  name?: string | null
  price?: string | null
}

const SCRAPINGBEE_ENDPOINT = "https://app.scrapingbee.com/api/v1/"

/**
 * ScrapingBee extract rules: pull every property card from a Booking.com search
 * results page and return its title + price string.
 */
const EXTRACT_RULES = {
  hotels: {
    selector: '[data-testid="property-card"]',
    type: "list",
    output: {
      name: '[data-testid="title"]',
      price: '[data-testid="price-and-discounted-price"]',
    },
  },
}

/**
 * Build a Booking.com search URL for a one-night stay in `city` starting on
 * `checkIn` (yyyy-MM-dd).
 */
function buildBookingUrl(city: string, checkIn: string): string {
  const checkOut = format(addDays(parseISO(checkIn), 1), "yyyy-MM-dd")
  const params = new URLSearchParams({
    ss: city,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: "2",
    group_children: "0",
    no_rooms: "1",
    selected_currency: "USD",
  })
  return `https://www.booking.com/searchresults.html?${params.toString()}`
}

/** Convert a price string like "$1,150" or "US$150" into a clean number. */
export function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null
  const digits = raw.replace(/[^0-9.]/g, "")
  if (!digits) return null
  const value = Number.parseFloat(digits)
  return Number.isFinite(value) && value > 0 ? Math.round(value) : null
}

/**
 * Scrape Booking.com competitor pricing for a city/date via the ScrapingBee
 * REST API. Uses JS rendering + premium proxies, and ScrapingBee's server-side
 * extract_rules so we receive structured JSON rather than raw HTML.
 *
 * Returns a de-duplicated list of `{ name, price }` for valid property cards.
 */
export async function scrapeCompetitorRates(city: string, checkIn: string): Promise<ScrapedHotel[]> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY
  if (!apiKey) {
    throw new Error("SCRAPINGBEE_API_KEY is not configured")
  }

  const target = buildBookingUrl(city, checkIn)
  const url = new URL(SCRAPINGBEE_ENDPOINT)
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("url", target)
  url.searchParams.set("render_js", "true")
  url.searchParams.set("premium_proxy", "true")
  url.searchParams.set("extract_rules", JSON.stringify(EXTRACT_RULES))

  const res = await fetch(url.toString(), { method: "GET" })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`ScrapingBee request failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = (await res.json()) as { hotels?: ScrapingBeeRawHotel[] }
  const rawHotels = Array.isArray(data.hotels) ? data.hotels : []

  const seen = new Set<string>()
  const hotels: ScrapedHotel[] = []
  for (const raw of rawHotels) {
    const name = raw.name?.trim()
    const price = parsePrice(raw.price)
    if (!name || price === null) continue
    if (seen.has(name)) continue
    seen.add(name)
    hotels.push({ name, price })
  }
  return hotels
}
