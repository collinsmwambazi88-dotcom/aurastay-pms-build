import { query } from "@/lib/db"
import type {
  Room,
  RoomGroup,
  RatePlan,
  Addon,
  GanttStay,
  MarketPoint,
} from "@/lib/types"

/* ------------------------------------------------------------------ */
/* Inventory                                                          */
/* ------------------------------------------------------------------ */

export async function getRoomGroups(propertyId: number): Promise<RoomGroup[]> {
  const res = await query<RoomGroup>(
    `SELECT id, property_id, name, description, base_capacity, max_capacity
     FROM room_groups WHERE property_id = $1 ORDER BY id`,
    [propertyId],
  )
  return res.rows
}

export async function getRooms(propertyId: number): Promise<Room[]> {
  const res = await query<Room>(
    `SELECT r.id, r.room_group_id, r.room_number, r.floor, r.status
     FROM rooms r
     JOIN room_groups rg ON rg.id = r.room_group_id
     WHERE rg.property_id = $1
     ORDER BY rg.id, r.room_number`,
    [propertyId],
  )
  return res.rows
}

export interface InventorySummary {
  total: number
  clean: number
  occupied: number
  dirty: number
  out_of_order: number
}

export async function getInventorySummary(propertyId: number): Promise<InventorySummary> {
  const res = await query<Record<string, string>>(
    `SELECT
       count(*)::int AS total,
       count(*) FILTER (WHERE r.status = 'clean')::int AS clean,
       count(*) FILTER (WHERE r.status = 'occupied')::int AS occupied,
       count(*) FILTER (WHERE r.status = 'dirty')::int AS dirty,
       count(*) FILTER (WHERE r.status = 'out_of_order')::int AS out_of_order
     FROM rooms r
     JOIN room_groups rg ON rg.id = r.room_group_id
     WHERE rg.property_id = $1`,
    [propertyId],
  )
  const row = res.rows[0]
  return {
    total: Number(row.total),
    clean: Number(row.clean),
    occupied: Number(row.occupied),
    dirty: Number(row.dirty),
    out_of_order: Number(row.out_of_order),
  }
}

/* ------------------------------------------------------------------ */
/* Reservations Gantt                                                 */
/* ------------------------------------------------------------------ */

export async function getGanttStays(propertyId: number): Promise<GanttStay[]> {
  const res = await query<GanttStay>(
    `SELECT
       s.id            AS stay_id,
       s.reservation_id,
       s.room_id,
       s.room_group_id,
       r.room_number,
       rg.name         AS group_name,
       g.full_name     AS guest_name,
       s.status,
       s.check_in::text,
       s.check_out::text,
       s.nightly_rate::float8 AS nightly_rate,
       s.guests_count
     FROM stays s
     JOIN reservations res ON res.id = s.reservation_id
     JOIN rooms r ON r.id = s.room_id
     JOIN room_groups rg ON rg.id = s.room_group_id
     JOIN guests g ON g.id = res.guest_id
     WHERE res.property_id = $1 AND s.status <> 'cancelled'
       AND s.check_out >= CURRENT_DATE
       AND s.check_in <= CURRENT_DATE + INTERVAL '14 days'
     ORDER BY rg.id, r.room_number`,
    [propertyId],
  )
  return res.rows.map((r) => ({ ...r, nightly_rate: Number(r.nightly_rate) }))
}

/* ------------------------------------------------------------------ */
/* Dashboard metrics                                                  */
/* ------------------------------------------------------------------ */

export interface DashboardMetrics {
  occupancy: number
  occupiedRooms: number
  totalRooms: number
  dailyRevenue: number
  adr: number
  revpar: number
  arrivals: number
  departures: number
  inHouseGuests: number
}

export async function getDashboardMetrics(propertyId: number): Promise<DashboardMetrics> {
  const res = await query<Record<string, string>>(
    `WITH rooms_count AS (
       SELECT count(*)::int AS total
       FROM rooms r JOIN room_groups rg ON rg.id = r.room_group_id
       WHERE rg.property_id = $1
     ),
     active AS (
       SELECT s.nightly_rate, s.guests_count
       FROM stays s JOIN reservations res ON res.id = s.reservation_id
       WHERE res.property_id = $1
         AND s.status IN ('checked_in','confirmed')
         AND s.check_in <= CURRENT_DATE AND s.check_out > CURRENT_DATE
     )
     SELECT
       (SELECT total FROM rooms_count) AS total_rooms,
       (SELECT count(*) FROM active)::int AS occupied_rooms,
       (SELECT COALESCE(SUM(nightly_rate),0) FROM active)::float8 AS daily_revenue,
       (SELECT COALESCE(SUM(guests_count),0) FROM active)::int AS in_house_guests,
       (SELECT count(*) FROM stays s JOIN reservations res ON res.id = s.reservation_id
          WHERE res.property_id = $1 AND s.check_in = CURRENT_DATE)::int AS arrivals,
       (SELECT count(*) FROM stays s JOIN reservations res ON res.id = s.reservation_id
          WHERE res.property_id = $1 AND s.check_out = CURRENT_DATE)::int AS departures`,
    [propertyId],
  )
  const row = res.rows[0]
  const totalRooms = Number(row.total_rooms)
  const occupiedRooms = Number(row.occupied_rooms)
  const dailyRevenue = Number(row.daily_revenue)
  const occupancy = totalRooms ? (occupiedRooms / totalRooms) * 100 : 0
  const adr = occupiedRooms ? dailyRevenue / occupiedRooms : 0
  const revpar = totalRooms ? dailyRevenue / totalRooms : 0
  return {
    occupancy,
    occupiedRooms,
    totalRooms,
    dailyRevenue,
    adr,
    revpar,
    arrivals: Number(row.arrivals),
    departures: Number(row.departures),
    inHouseGuests: Number(row.in_house_guests),
  }
}

export interface ArrivalDeparture {
  reservation_id: number
  guest_name: string
  room_number: string
  group_name: string
  check_in: string
  check_out: string
  status: string
}

export async function getTodayMovements(propertyId: number): Promise<{
  arrivals: ArrivalDeparture[]
  departures: ArrivalDeparture[]
}> {
  const res = await query<ArrivalDeparture & { today_check_in: boolean; today_check_out: boolean }>(
    `SELECT s.reservation_id, g.full_name AS guest_name, r.room_number,
            rg.name AS group_name, s.check_in::text, s.check_out::text, s.status,
            (s.check_in = CURRENT_DATE) AS today_check_in,
            (s.check_out = CURRENT_DATE) AS today_check_out
     FROM stays s
     JOIN reservations res ON res.id = s.reservation_id
     JOIN guests g ON g.id = res.guest_id
     JOIN rooms r ON r.id = s.room_id
     JOIN room_groups rg ON rg.id = s.room_group_id
     WHERE res.property_id = $1
       AND (s.check_in = CURRENT_DATE OR s.check_out = CURRENT_DATE)
       AND s.status <> 'cancelled'
     ORDER BY s.check_in`,
    [propertyId],
  )
  return {
    arrivals: res.rows.filter((r) => r.today_check_in),
    departures: res.rows.filter((r) => r.today_check_out),
  }
}

/* ------------------------------------------------------------------ */
/* Pricing                                                            */
/* ------------------------------------------------------------------ */

export async function getRatePlans(propertyId: number): Promise<RatePlan[]> {
  const res = await query<RatePlan>(
    `SELECT id, property_id, name, description, adjustment_type,
            adjustment_value::float8 AS adjustment_value,
            includes_breakfast, refundable
     FROM rate_plans WHERE property_id = $1 ORDER BY id`,
    [propertyId],
  )
  return res.rows.map((r) => ({ ...r, adjustment_value: Number(r.adjustment_value) }))
}

export async function getAddons(propertyId: number): Promise<Addon[]> {
  const res = await query<Addon>(
    `SELECT id, property_id, name, price::float8 AS price
     FROM addons WHERE property_id = $1 ORDER BY id`,
    [propertyId],
  )
  return res.rows.map((r) => ({ ...r, price: Number(r.price) }))
}

export interface RateCalendarRow {
  room_group_id: number
  group_name: string
  rates: { stay_date: string; base_rate: number }[]
}

export async function getRateCalendar(propertyId: number): Promise<{
  dates: string[]
  rows: RateCalendarRow[]
}> {
  const res = await query<{
    room_group_id: number
    group_name: string
    stay_date: string
    base_rate: number
  }>(
    `SELECT rg.id AS room_group_id, rg.name AS group_name,
            rc.stay_date::text, rc.base_rate::float8 AS base_rate
     FROM rate_calendars rc
     JOIN room_groups rg ON rg.id = rc.room_group_id
     WHERE rg.property_id = $1
       AND rc.stay_date >= CURRENT_DATE
       AND rc.stay_date < CURRENT_DATE + INTERVAL '14 days'
     ORDER BY rg.id, rc.stay_date`,
    [propertyId],
  )
  const datesSet = new Set<string>()
  const map = new Map<number, RateCalendarRow>()
  for (const r of res.rows) {
    datesSet.add(r.stay_date)
    if (!map.has(r.room_group_id)) {
      map.set(r.room_group_id, { room_group_id: r.room_group_id, group_name: r.group_name, rates: [] })
    }
    map.get(r.room_group_id)!.rates.push({ stay_date: r.stay_date, base_rate: Number(r.base_rate) })
  }
  return { dates: Array.from(datesSet).sort(), rows: Array.from(map.values()) }
}

/* ------------------------------------------------------------------ */
/* Market intelligence                                                */
/* ------------------------------------------------------------------ */

export async function getMarketData(city: string): Promise<MarketPoint[]> {
  const res = await query<MarketPoint>(
    `SELECT stay_date::text, our_price::float8 AS our_price,
            competitor_price::float8 AS competitor_price
     FROM market_data WHERE city = $1 AND stay_date >= CURRENT_DATE
     ORDER BY stay_date LIMIT 14`,
    [city],
  )
  return res.rows.map((r) => ({
    ...r,
    our_price: Number(r.our_price),
    competitor_price: Number(r.competitor_price),
  }))
}

/* ------------------------------------------------------------------ */
/* Reservations list + folio                                          */
/* ------------------------------------------------------------------ */

export interface ReservationListItem {
  id: number
  guest_name: string
  status: string
  check_in: string
  check_out: string
  rate_plan: string | null
  invoice_status: string | null
  invoice_total: number
  room_count: number
}

export async function getReservations(propertyId: number): Promise<ReservationListItem[]> {
  const res = await query<ReservationListItem>(
    `SELECT res.id, g.full_name AS guest_name, res.status,
            res.check_in::text, res.check_out::text,
            rp.name AS rate_plan,
            inv.status AS invoice_status,
            COALESCE(inv.total,0)::float8 AS invoice_total,
            (SELECT count(*) FROM stays s WHERE s.reservation_id = res.id)::int AS room_count
     FROM reservations res
     JOIN guests g ON g.id = res.guest_id
     LEFT JOIN rate_plans rp ON rp.id = res.rate_plan_id
     LEFT JOIN invoices inv ON inv.reservation_id = res.id
     WHERE res.property_id = $1
     ORDER BY res.check_in DESC`,
    [propertyId],
  )
  return res.rows.map((r) => ({ ...r, invoice_total: Number(r.invoice_total), room_count: Number(r.room_count) }))
}

export interface FolioStay {
  id: number
  room_number: string
  group_name: string
  check_in: string
  check_out: string
  nightly_rate: number
  guests_count: number
  status: string
}

export interface FolioLineItem {
  id: number
  description: string
  item_type: string
  quantity: number
  unit_price: number
  amount: number
}

export interface Folio {
  reservation: {
    id: number
    status: string
    check_in: string
    check_out: string
    rate_plan: string | null
  }
  guest: {
    full_name: string
    email: string | null
    phone: string | null
    id_type: string | null
    id_number: string | null
  }
  invoice: { id: number; status: string; total: number } | null
  stays: FolioStay[]
  lineItems: FolioLineItem[]
}

export async function getFolio(propertyId: number, reservationId: number): Promise<Folio | null> {
  const resv = await query<Record<string, unknown>>(
    `SELECT res.id, res.status, res.check_in::text, res.check_out::text,
            rp.name AS rate_plan,
            g.full_name, g.email, g.phone, g.id_type, g.id_number,
            inv.id AS invoice_id, inv.status AS invoice_status, inv.total::float8 AS invoice_total
     FROM reservations res
     JOIN guests g ON g.id = res.guest_id
     LEFT JOIN rate_plans rp ON rp.id = res.rate_plan_id
     LEFT JOIN invoices inv ON inv.reservation_id = res.id
     WHERE res.id = $1 AND res.property_id = $2`,
    [reservationId, propertyId],
  )
  if (resv.rows.length === 0) return null
  const r = resv.rows[0] as Record<string, any>

  const staysRes = await query<FolioStay>(
    `SELECT s.id, rm.room_number, rg.name AS group_name,
            s.check_in::text, s.check_out::text,
            s.nightly_rate::float8 AS nightly_rate, s.guests_count, s.status
     FROM stays s
     JOIN rooms rm ON rm.id = s.room_id
     JOIN room_groups rg ON rg.id = s.room_group_id
     WHERE s.reservation_id = $1 ORDER BY s.id`,
    [reservationId],
  )

  const itemsRes = r.invoice_id
    ? await query<FolioLineItem>(
        `SELECT id, description, item_type, quantity,
                unit_price::float8 AS unit_price, amount::float8 AS amount
         FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id`,
        [r.invoice_id],
      )
    : { rows: [] as FolioLineItem[] }

  return {
    reservation: {
      id: Number(r.id),
      status: r.status,
      check_in: r.check_in,
      check_out: r.check_out,
      rate_plan: r.rate_plan,
    },
    guest: {
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      id_type: r.id_type,
      id_number: r.id_number,
    },
    invoice: r.invoice_id
      ? { id: Number(r.invoice_id), status: r.invoice_status, total: Number(r.invoice_total) }
      : null,
    stays: staysRes.rows.map((s) => ({ ...s, nightly_rate: Number(s.nightly_rate), guests_count: Number(s.guests_count) })),
    lineItems: itemsRes.rows.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      amount: Number(i.amount),
    })),
  }
}
