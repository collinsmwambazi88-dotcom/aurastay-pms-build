"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { query, withConnection } from "@/lib/db"
import { PROPERTY_COOKIE } from "@/lib/property"
import { computeDerivedPrice, nightsBetween } from "@/lib/revenue"
import type { RatePlan } from "@/lib/types"

export async function setActiveProperty(propertyId: number) {
  const cookieStore = await cookies()
  cookieStore.set(PROPERTY_COOKIE, String(propertyId), { path: "/", maxAge: 60 * 60 * 24 * 365 })
  revalidatePath("/", "layout")
}

export async function checkInReservation(reservationId: number) {
  await withConnection(async (client) => {
    await client.query(`UPDATE reservations SET status = 'checked_in' WHERE id = $1`, [reservationId])
    await client.query(`UPDATE stays SET status = 'checked_in' WHERE reservation_id = $1 AND status = 'confirmed'`, [
      reservationId,
    ])
    await client.query(
      `UPDATE rooms SET status = 'occupied'
       WHERE id IN (SELECT room_id FROM stays WHERE reservation_id = $1)`,
      [reservationId],
    )
  })
  revalidatePath("/", "layout")
}

export async function checkOutReservation(reservationId: number) {
  await withConnection(async (client) => {
    await client.query(`UPDATE reservations SET status = 'checked_out' WHERE id = $1`, [reservationId])
    await client.query(`UPDATE stays SET status = 'checked_out' WHERE reservation_id = $1 AND status = 'checked_in'`, [
      reservationId,
    ])
    // Rooms become dirty on checkout, awaiting housekeeping
    await client.query(
      `UPDATE rooms SET status = 'dirty'
       WHERE id IN (SELECT room_id FROM stays WHERE reservation_id = $1)`,
      [reservationId],
    )
  })
  revalidatePath("/", "layout")
}

export async function updateRoomStatus(roomId: number, status: string) {
  await query(`UPDATE rooms SET status = $1 WHERE id = $2`, [status, roomId])
  revalidatePath("/", "layout")
}

export async function markInvoicePaid(invoiceId: number) {
  await query(`UPDATE invoices SET status = 'paid' WHERE id = $1`, [invoiceId])
  revalidatePath("/reservations")
}

/** Add an incidental charge to a folio's invoice and recalculate the total. */
export async function addFolioCharge(input: {
  invoiceId: number
  description: string
  quantity: number
  unitPrice: number
  itemType?: "addon" | "fee" | "tax"
}) {
  const amount = Math.round(input.quantity * input.unitPrice * 100) / 100
  await withConnection(async (client) => {
    await client.query(
      `INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [input.invoiceId, input.description, input.itemType ?? "fee", input.quantity, input.unitPrice, amount],
    )
    await client.query(
      `UPDATE invoices
       SET total = (SELECT COALESCE(SUM(amount),0) FROM invoice_line_items WHERE invoice_id = $1)
       WHERE id = $1`,
      [input.invoiceId],
    )
  })
  revalidatePath("/reservations")
}

export async function updateRate(roomGroupId: number, stayDate: string, baseRate: number) {
  await query(
    `INSERT INTO rate_calendars (room_group_id, stay_date, base_rate)
     VALUES ($1,$2,$3)
     ON CONFLICT (room_group_id, stay_date)
     DO UPDATE SET base_rate = EXCLUDED.base_rate`,
    [roomGroupId, stayDate, baseRate],
  )
  revalidatePath("/pricing")
}

/** Bulk adjust rates across a group's next 14 days by a percentage (e.g. +10). */
export async function bulkAdjustRates(roomGroupId: number, percent: number) {
  await query(
    `UPDATE rate_calendars
     SET base_rate = ROUND(base_rate * (1 + $2 / 100.0), 2)
     WHERE room_group_id = $1
       AND stay_date >= CURRENT_DATE
       AND stay_date < CURRENT_DATE + INTERVAL '14 days'`,
    [roomGroupId, percent],
  )
  revalidatePath("/pricing")
}

export interface CreateBookingInput {
  propertyId: number
  roomGroupId: number
  roomId: number
  ratePlanId: number | null
  checkIn: string
  checkOut: string
  guests: number
  guestName: string
  guestEmail: string
  guestPhone: string
  idType: string
  idNumber: string
  addonIds: number[]
}

export async function createBooking(input: CreateBookingInput): Promise<{ reservationId: number }> {
  return withConnection(async (client) => {
    const nights = nightsBetween(input.checkIn, input.checkOut)

    // Resolve base rate (first night) and room group capacity
    const rateRes = await client.query<{ base_rate: string; base_capacity: number }>(
      `SELECT rc.base_rate::float8 AS base_rate, rg.base_capacity
       FROM rate_calendars rc
       JOIN room_groups rg ON rg.id = rc.room_group_id
       WHERE rc.room_group_id = $1 AND rc.stay_date = $2`,
      [input.roomGroupId, input.checkIn],
    )
    const baseRate = Number(rateRes.rows[0]?.base_rate ?? 200)
    const baseCapacity = Number(rateRes.rows[0]?.base_capacity ?? 2)

    let plan: RatePlan | null = null
    if (input.ratePlanId) {
      const planRes = await client.query<RatePlan>(
        `SELECT id, property_id, name, description, adjustment_type,
                adjustment_value::float8 AS adjustment_value, includes_breakfast, refundable
         FROM rate_plans WHERE id = $1`,
        [input.ratePlanId],
      )
      plan = planRes.rows[0] ?? null
    }

    const breakdown = computeDerivedPrice({
      baseRate,
      baseCapacity,
      guests: input.guests,
      plan: plan ? { name: plan.name, adjustment_type: plan.adjustment_type, adjustment_value: Number(plan.adjustment_value) } : null,
    })

    // Guest
    const guestRes = await client.query<{ id: number }>(
      `INSERT INTO guests (property_id, full_name, email, phone, id_type, id_number)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [input.propertyId, input.guestName, input.guestEmail || null, input.guestPhone || null, input.idType || null, input.idNumber || null],
    )
    const guestId = guestRes.rows[0].id

    // Reservation
    const resvRes = await client.query<{ id: number }>(
      `INSERT INTO reservations (property_id, guest_id, rate_plan_id, status, check_in, check_out)
       VALUES ($1,$2,$3,'confirmed',$4,$5) RETURNING id`,
      [input.propertyId, guestId, input.ratePlanId, input.checkIn, input.checkOut],
    )
    const reservationId = resvRes.rows[0].id

    // Stay
    await client.query(
      `INSERT INTO stays (reservation_id, room_id, room_group_id, check_in, check_out, nightly_rate, guests_count, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed')`,
      [reservationId, input.roomId, input.roomGroupId, input.checkIn, input.checkOut, breakdown.nightlyRate, input.guests],
    )

    // Invoice + line items
    const invRes = await client.query<{ id: number }>(
      `INSERT INTO invoices (reservation_id, status, total) VALUES ($1,'pending',0) RETURNING id`,
      [reservationId],
    )
    const invoiceId = invRes.rows[0].id

    const roomGroupName = await client.query<{ name: string }>(`SELECT name FROM room_groups WHERE id = $1`, [
      input.roomGroupId,
    ])
    await client.query(
      `INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
       VALUES ($1,$2,'room',$3,$4,$5)`,
      [
        invoiceId,
        `${roomGroupName.rows[0]?.name ?? "Room"} - ${nights} night${nights > 1 ? "s" : ""}`,
        nights,
        breakdown.nightlyRate,
        breakdown.nightlyRate * nights,
      ],
    )

    // Add-ons
    if (input.addonIds.length > 0) {
      const addonsRes = await client.query<{ id: number; name: string; price: string }>(
        `SELECT id, name, price::float8 AS price FROM addons WHERE id = ANY($1::int[])`,
        [input.addonIds],
      )
      for (const a of addonsRes.rows) {
        await client.query(
          `INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
           VALUES ($1,$2,'addon',$3,$4,$5)`,
          [invoiceId, a.name, nights, Number(a.price), Number(a.price) * nights],
        )
      }
    }

    // Update invoice total
    await client.query(
      `UPDATE invoices SET total = (SELECT COALESCE(SUM(amount),0) FROM invoice_line_items WHERE invoice_id = $1) WHERE id = $1`,
      [invoiceId],
    )

    revalidatePath("/", "layout")
    return { reservationId }
  })
}

export interface BookingQuote {
  available: number
  nightlyRate: number
  baseRate: number
  occupancySurcharge: number
  planAdjustment: number
  planLabel: string
  nights: number
  roomTotal: number
  addonsTotal: number
  total: number
}

/** Live quote: availability + price breakdown for the booking dialog. */
export async function quoteBooking(input: {
  roomGroupId: number
  ratePlanId: number | null
  checkIn: string
  checkOut: string
  guests: number
  addonIds: number[]
}): Promise<BookingQuote> {
  const nights = nightsBetween(input.checkIn, input.checkOut)

  const rateRes = await query<{ base_rate: string; base_capacity: number }>(
    `SELECT rc.base_rate::float8 AS base_rate, rg.base_capacity
     FROM rate_calendars rc
     JOIN room_groups rg ON rg.id = rc.room_group_id
     WHERE rc.room_group_id = $1 AND rc.stay_date = $2`,
    [input.roomGroupId, input.checkIn],
  )
  const baseRate = Number(rateRes.rows[0]?.base_rate ?? 200)
  const baseCapacity = Number(rateRes.rows[0]?.base_capacity ?? 2)

  let plan: RatePlan | null = null
  if (input.ratePlanId) {
    const planRes = await query<RatePlan>(
      `SELECT id, property_id, name, description, adjustment_type,
              adjustment_value::float8 AS adjustment_value, includes_breakfast, refundable
       FROM rate_plans WHERE id = $1`,
      [input.ratePlanId],
    )
    plan = planRes.rows[0] ?? null
  }

  const breakdown = computeDerivedPrice({
    baseRate,
    baseCapacity,
    guests: input.guests,
    plan: plan
      ? { name: plan.name, adjustment_type: plan.adjustment_type, adjustment_value: Number(plan.adjustment_value) }
      : null,
  })

  const available = await getAvailableRooms(input.roomGroupId, input.checkIn, input.checkOut)

  let addonsTotal = 0
  if (input.addonIds.length > 0) {
    const addonsRes = await query<{ total: string }>(
      `SELECT COALESCE(SUM(price),0)::float8 AS total FROM addons WHERE id = ANY($1::int[])`,
      [input.addonIds],
    )
    addonsTotal = Number(addonsRes.rows[0]?.total ?? 0) * nights
  }

  const roomTotal = breakdown.nightlyRate * nights
  return {
    available: available.length,
    nightlyRate: breakdown.nightlyRate,
    baseRate: breakdown.baseRate,
    occupancySurcharge: breakdown.occupancySurcharge,
    planAdjustment: breakdown.planAdjustment,
    planLabel: breakdown.planLabel,
    nights,
    roomTotal,
    addonsTotal,
    total: roomTotal + addonsTotal,
  }
}

export interface AvailableRoom {
  id: number
  room_number: string
  room_group_id: number
}

/** Inventory service: rooms in a group with no overlapping stay for the date range. */
export async function getAvailableRooms(
  roomGroupId: number,
  checkIn: string,
  checkOut: string,
): Promise<AvailableRoom[]> {
  const res = await query<AvailableRoom>(
    `SELECT r.id, r.room_number, r.room_group_id
     FROM rooms r
     WHERE r.room_group_id = $1
       AND r.status <> 'out_of_order'
       AND NOT EXISTS (
         SELECT 1 FROM stays s
         WHERE s.room_id = r.id
           AND s.status <> 'cancelled'
           AND s.check_in < $3 AND s.check_out > $2
       )
     ORDER BY r.room_number`,
    [roomGroupId, checkIn, checkOut],
  )
  return res.rows
}
