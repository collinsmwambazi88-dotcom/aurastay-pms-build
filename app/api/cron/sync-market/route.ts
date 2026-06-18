import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { generateTargetDates } from "@/lib/market-intel-utils"
import { scrapeCompetitorRates } from "@/lib/scraper"

// Vercel Hobby plan max: 300 seconds. Using 290 to ensure safe shutdown before hard timeout.
export const maxDuration = 290
export const dynamic = "force-dynamic"

const AGGREGATE_SENTINEL = "__MARKET_AVG__"
const SOURCE = "Booking.com"
const DELAY_MS = 1000
const MAX_DURATION_MS = 280_000 // Stop at 280 seconds to allow shutdown time

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Check if we've exceeded the elapsed time threshold to ensure graceful shutdown.
 */
const shouldStop = (startTime: number): boolean => {
  return Date.now() - startTime >= MAX_DURATION_MS
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Secure the endpoint: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Default to 7-day horizon for Hobby plan compliance. Allow override for testing.
  const horizonParam = request.nextUrl.searchParams.get("horizon")
  const parsedHorizon = horizonParam === null ? Number.NaN : Number(horizonParam)
  const horizon = Number.isFinite(parsedHorizon) && parsedHorizon >= 0 ? parsedHorizon : 7

  const citiesRes = await query<{ city: string }>(
    `SELECT DISTINCT city FROM properties ORDER BY city`,
  )
  const cities = citiesRes.rows.map((r) => r.city)
  const dates = generateTargetDates(horizon)

  let hotelsUpserted = 0
  let aggregatesWritten = 0
  let scrapeCalls = 0
  let citiesProcessed = 0
  let datesProcessed = 0
  const errors: string[] = []
  let partialSuccess = false

  for (const city of cities) {
    if (shouldStop(startTime)) {
      partialSuccess = true
      break
    }

    citiesProcessed++

    for (const stayDate of dates) {
      if (shouldStop(startTime)) {
        partialSuccess = true
        break
      }

      datesProcessed++

      try {
        const hotels = await scrapeCompetitorRates(city, stayDate)
        scrapeCalls++

        if (hotels.length > 0) {
          // UPSERT each individual hotel result.
          for (const hotel of hotels) {
            await query(
              `INSERT INTO market_data (city, stay_date, competitor_price, source, hotel_name, scraped_at)
               VALUES ($1, $2, $3, $4, $5, now())
               ON CONFLICT (city, stay_date, hotel_name)
               DO UPDATE SET competitor_price = EXCLUDED.competitor_price,
                             source = EXCLUDED.source,
                             scraped_at = now()`,
              [city, stayDate, hotel.price, SOURCE, hotel.name],
            )
            hotelsUpserted++
          }

          // Aggregate: average the cheapest (top) 10 hotels for the city/date.
          const top10 = [...hotels].sort((a, b) => a.price - b.price).slice(0, 10)
          const avg = Math.round(top10.reduce((sum, h) => sum + h.price, 0) / top10.length)

          await query(
            `INSERT INTO market_data (city, stay_date, competitor_price, source, hotel_name, scraped_at)
             VALUES ($1, $2, $3, $4, $5, now())
             ON CONFLICT (city, stay_date, hotel_name)
             DO UPDATE SET competitor_price = EXCLUDED.competitor_price,
                           source = EXCLUDED.source,
                           scraped_at = now()`,
            [city, stayDate, avg, SOURCE, AGGREGATE_SENTINEL],
          )
          aggregatesWritten++
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`${city} ${stayDate}: ${message}`)
        console.error("[v0] sync-market error", city, stayDate, message)
      }

      // Throttle to respect ScrapingBee concurrency limits.
      await sleep(DELAY_MS)
    }

    if (partialSuccess) {
      break
    }
  }

  const elapsed = Date.now() - startTime

  return NextResponse.json({
    status: partialSuccess ? "Partial Success" : "Success",
    ok: true,
    partialSuccess,
    elapsedSeconds: (elapsed / 1000).toFixed(2),
    cities: cities.length,
    citiesProcessed,
    datesPerCity: dates.length,
    datesProcessed,
    scrapeCalls,
    hotelsUpserted,
    aggregatesWritten,
    errorCount: errors.length,
    errors: errors.slice(0, 20),
    message: partialSuccess
      ? "Scraping stopped at 280s to ensure graceful shutdown. Will resume on next cron run."
      : "All data scraped successfully within time limit.",
  })
}
