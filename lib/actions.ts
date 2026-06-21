"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { query, withConnection } from "@/lib/db"
import { PROPERTY_COOKIE } from "@/lib/property"
import { computeDerivedPrice, computeTax, nightsBetween } from "@/lib/revenue"
import { roleDefaults, isPermissionKey } from "@/lib/permissions"
import { sendGuestWelcomeEmail, sendGuestFarewellEmail } from "@/lib/email-service"
import type { RatePlan } from "@/lib/types"

export async function setActiveProperty(propertyId: number) {
  const cookieStore = await cookies()
  cookieStore.set(PROPERTY_COOKIE, String(propertyId), { path: "/", maxAge: 60 * 60 * 24 * 365 })
  redirect("/")
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

  // Fetch guest details and property info to send welcome email
  try {
    const res = await query(
      `SELECT
        g.full_name  AS guest_full_name,
        g.email      AS guest_email,
        r.check_in   AS check_in_date,
        r.check_out  AS check_out_date,
        p.name       AS property_name
       FROM reservations r
       JOIN guests     g ON g.id = r.guest_id
       JOIN properties p ON p.id = r.property_id
       WHERE r.id = $1`,
      [reservationId],
    )

    if (res.rows && res.rows.length > 0) {
      const {
        guest_full_name,
        guest_email,
        check_in_date,
        check_out_date,
        property_name,
      } = res.rows[0] as {
        guest_full_name: string
        guest_email: string | null
        check_in_date: string
        check_out_date: string
        property_name: string
      }

      if (!guest_email) {
        console.warn(`[checkInReservation] No email on record for reservation ${reservationId} — skipping welcome email`)
      } else {
        const ratingLink = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${reservationId}`
        await sendGuestWelcomeEmail({
          to: guest_email,
          guestName: guest_full_name,
          hotelName: property_name,
          checkInDate: new Date(check_in_date).toLocaleDateString(),
          checkOutDate: new Date(check_out_date).toLocaleDateString(),
          ratingLink,
        })
      }
    }
  } catch (error) {
    console.error("[checkInReservation] Error sending welcome email:", error)
    // Don't crash if email fails — check-in is already committed
  }

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

  // Fetch guest details and property info to send farewell email
  try {
    const res = await query(
      `SELECT
        g.full_name  AS guest_full_name,
        g.email      AS guest_email,
        r.check_out  AS check_out_date,
        p.name       AS property_name
       FROM reservations r
       JOIN guests     g ON g.id = r.guest_id
       JOIN properties p ON p.id = r.property_id
       WHERE r.id = $1`,
      [reservationId],
    )

    if (res.rows && res.rows.length > 0) {
      const {
        guest_full_name,
        guest_email,
        check_out_date,
        property_name,
      } = res.rows[0] as {
        guest_full_name: string
        guest_email: string | null
        check_out_date: string
        property_name: string
      }

      if (!guest_email) {
        console.warn(`[checkOutReservation] No email on record for reservation ${reservationId} — skipping farewell email`)
      } else {
        const ratingLink = `${process.env.NEXT_PUBLIC_APP_URL}/rate/${reservationId}`
        await sendGuestFarewellEmail({
          to: guest_email,
          guestName: guest_full_name,
          hotelName: property_name,
          checkOutDate: new Date(check_out_date).toLocaleDateString(),
          ratingLink,
        })
      }
    }
  } catch (error) {
    console.error("[checkOutReservation] Error sending farewell email:", error)
    // Don't crash if email fails — check-out is already committed
  }

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

/**
 * Bulk update rates for room groups across a date range and specific days of week.
 * Upserts one row per (roomGroupId, stayDate) combination that matches all filters.
 */
export async function bulkUpdateBaseRates(input: {
  propertyId: number
  roomGroupIds: number[]
  startDate: string
  endDate: string
  daysOfWeek: number[] // 0=Sun, 1=Mon, ..., 6=Sat
  newBaseRate: number
}): Promise<{ ok: boolean; error?: string; updatedCount?: number }> {
  if (!Number.isFinite(input.newBaseRate) || input.newBaseRate < 0) {
    return { ok: false, error: "Base rate must be a non-negative number." }
  }
  if (input.roomGroupIds.length === 0) {
    return { ok: false, error: "Select at least one room type." }
  }
  if (input.daysOfWeek.length === 0) {
    return { ok: false, error: "Select at least one day of week." }
  }

  // Build SQL: insert/update for each date in range where the day-of-week matches.
  const dowCase = input.daysOfWeek.map((d) => String(d)).join(",")
  const res = await query<{ count: number }>(
    `WITH date_range AS (
       SELECT $1::date + (n || ' days')::interval AS stay_date
       FROM generate_series(0, $2::int) n
       WHERE EXTRACT(DOW FROM $1::date + (n || ' days')::interval) IN (${dowCase})
     )
     INSERT INTO rate_calendars (room_group_id, stay_date, base_rate)
     SELECT rg.id, dr.stay_date, $3::float8
     FROM date_range dr
     CROSS JOIN (SELECT id FROM room_groups WHERE id = ANY($4::int[])) rg
     ON CONFLICT (room_group_id, stay_date)
     DO UPDATE SET base_rate = EXCLUDED.base_rate
     RETURNING 1
    `,
    [input.startDate, Math.max(0, Math.round((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000)), input.newBaseRate, input.roomGroupIds],
  )
  revalidatePath("/pricing")
  return { ok: true, updatedCount: res.rowCount ?? 0 }
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

    const roomTotal = breakdown.nightlyRate * nights
    let addonsTotal = 0

    // Add-ons
    if (input.addonIds.length > 0) {
      const addonsRes = await client.query<{ id: number; name: string; price: string }>(
        `SELECT id, name, price::float8 AS price FROM addons WHERE id = ANY($1::int[])`,
        [input.addonIds],
      )
      for (const a of addonsRes.rows) {
        const lineAmount = Number(a.price) * nights
        addonsTotal += lineAmount
        await client.query(
          `INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
           VALUES ($1,$2,'addon',$3,$4,$5)`,
          [invoiceId, a.name, nights, Number(a.price), lineAmount],
        )
      }
    }

    // Tax: applied to the taxable subtotal (rooms + add-ons) at the property rate.
    const taxRes = await client.query<{ tax_rate: string }>(
      `SELECT tax_rate::float8 AS tax_rate FROM properties WHERE id = $1`,
      [input.propertyId],
    )
    const taxRate = Number(taxRes.rows[0]?.tax_rate ?? 0)
    const taxAmount = computeTax(roomTotal + addonsTotal, taxRate)
    if (taxAmount > 0) {
      await client.query(
        `INSERT INTO invoice_line_items (invoice_id, description, item_type, quantity, unit_price, amount)
         VALUES ($1,$2,'tax',1,$3,$3)`,
        [invoiceId, `Tax (${taxRate}%)`, taxAmount],
      )
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
  taxRate: number
  taxAmount: number
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

  // Resolve the property tax rate via the room group's owning property.
  const taxRes = await query<{ tax_rate: string }>(
    `SELECT p.tax_rate::float8 AS tax_rate
     FROM room_groups rg JOIN properties p ON p.id = rg.property_id
     WHERE rg.id = $1`,
    [input.roomGroupId],
  )
  const taxRate = Number(taxRes.rows[0]?.tax_rate ?? 0)

  const roomTotal = breakdown.nightlyRate * nights
  const taxAmount = computeTax(roomTotal + addonsTotal, taxRate)
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
    taxRate,
    taxAmount,
    total: roomTotal + addonsTotal + taxAmount,
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

/* ------------------------------------------------------------------ */
/* Admin: Inventory                                                   */
/* ------------------------------------------------------------------ */

export async function createRoom(input: {
  roomGroupId: number
  roomNumber: string
  floor: number
}): Promise<{ ok: boolean; error?: string }> {
  const number = input.roomNumber.trim()
  if (!number) return { ok: false, error: "Room number is required." }
  const dup = await query(`SELECT 1 FROM rooms WHERE room_group_id = $1 AND room_number = $2`, [
    input.roomGroupId,
    number,
  ])
  if (dup.rowCount && dup.rowCount > 0) return { ok: false, error: `Room ${number} already exists in this group.` }
  await query(
    `INSERT INTO rooms (room_group_id, room_number, floor, status) VALUES ($1,$2,$3,'clean')`,
    [input.roomGroupId, number, input.floor],
  )
  revalidatePath("/inventory")
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function createRoomGroup(input: {
  propertyId: number
  name: string
  description: string
  baseCapacity: number
  maxCapacity: number
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: "Category name is required." }
  await query(
    `INSERT INTO room_groups (property_id, name, description, base_capacity, max_capacity)
     VALUES ($1,$2,$3,$4,$5)`,
    [input.propertyId, name, input.description.trim() || null, input.baseCapacity, input.maxCapacity],
  )
  revalidatePath("/inventory")
  revalidatePath("/", "layout")
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* Admin: Staff & IAM                                                 */
/* ------------------------------------------------------------------ */

export async function inviteStaff(input: {
  propertyId: number
  fullName: string
  email: string
  role: import("@/lib/types").StaffRole
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.fullName.trim()
  const email = input.email.trim().toLowerCase()
  if (!name || !email) return { ok: false, error: "Name and email are required." }
  const dup = await query(`SELECT 1 FROM staff WHERE property_id = $1 AND email = $2`, [
    input.propertyId,
    email,
  ])
  if (dup.rowCount && dup.rowCount > 0) return { ok: false, error: "A staff member with that email already exists." }
  // Seed the granular permission map from the role's defaults.
  const permissions = roleDefaults(input.role)
  
  // Get property name for email
  const propertyRes = await query<{ name: string }>(
    `SELECT name FROM properties WHERE id = $1`,
    [input.propertyId],
  )
  const hotelName = propertyRes.rows[0]?.name || "Your Hotel"

  const staffRes = await query<{ id: number }>(
    `INSERT INTO staff (property_id, full_name, email, role, status, permissions)
     VALUES ($1,$2,$3,$4,'invited',$5::jsonb)
     RETURNING id`,
    [input.propertyId, name, email, input.role, JSON.stringify(permissions)],
  )

  const staffId = staffRes.rows[0]?.id
  if (!staffId) return { ok: false, error: "Failed to create staff member." }

  // Generate invitation link (Auth0 login with pre-filled email)
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/login?email=${encodeURIComponent(email)}`

  // Send invitation email
  const { sendStaffInvitationEmail } = await import("@/lib/email-service")
  const emailResult = await sendStaffInvitationEmail({
    to: email,
    staffName: name,
    hotelName,
    invitationLink,
    role: input.role,
  })

  if (!emailResult.success) {
    console.error(`[inviteStaff] Failed to send email to ${email}:`, emailResult.error)
    // Don't fail the whole operation if email fails - staff record was created
  }

  revalidatePath("/settings/staff")
  return { ok: true }
}

/** Toggle a single granular permission on a staff member. */
export async function updateStaffPermission(staffId: number, key: string, value: boolean) {
  // Validate the key against the catalog so only known permissions are stored.
  if (!isPermissionKey(key)) {
    return { ok: false, error: "Unknown permission." }
  }
  // jsonb_set with a single-element text[] path safely scopes the write to one key.
  await query(`UPDATE staff SET permissions = jsonb_set(permissions, ARRAY[$1], to_jsonb($2::boolean), true) WHERE id = $3`, [
    key,
    value,
    staffId,
  ])
  revalidatePath("/settings/staff")
  return { ok: true }
}

/** Change a member's role and reset their permissions to that role's defaults. */
export async function updateStaffRole(staffId: number, role: import("@/lib/types").StaffRole) {
  const permissions = roleDefaults(role)
  await query(`UPDATE staff SET role = $1, permissions = $2::jsonb WHERE id = $3`, [
    role,
    JSON.stringify(permissions),
    staffId,
  ])
  revalidatePath("/settings/staff")
}

export async function removeStaff(staffId: number) {
  await query(`DELETE FROM staff WHERE id = $1`, [staffId])
  revalidatePath("/settings/staff")
}

/**
 * Mark an invited staff member as active upon first login.
 * Called when a staff member successfully authenticates via Auth0.
 */
export async function activateStaff(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!email) return { ok: false, error: "Email is required." }

  const res = await query(
    `UPDATE staff SET status = 'active' WHERE email = $1 AND status = 'invited' RETURNING id`,
    [email.toLowerCase()],
  )

  if (res.rowCount && res.rowCount > 0) {
    revalidatePath("/settings/staff")
    return { ok: true }
  }

  // Staff not found or already active - this is fine
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* Admin: Property settings                                           */
/* ------------------------------------------------------------------ */

export async function updateProperty(input: {
  propertyId: number
  name: string
  city: string
  currency: string
  timezone: string
  taxRate: number
  logoUrl?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: "Property name is required." }
  if (!(input.taxRate >= 0) || input.taxRate > 100) {
    return { ok: false, error: "Tax rate must be between 0 and 100." }
  }
  await query(
    `UPDATE properties
     SET name = $1, city = $2, currency = $3, timezone = $4, tax_rate = $5,
         logo_url = COALESCE($6, logo_url)
     WHERE id = $7`,
    [name, input.city.trim(), input.currency, input.timezone, input.taxRate, input.logoUrl ?? null, input.propertyId],
  )
  revalidatePath("/", "layout")
  revalidatePath("/settings")
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* Housekeeping                                                       */
/* ------------------------------------------------------------------ */

/** Update a room's housekeeping status from the housekeeping board. */
export async function setHousekeepingStatus(
  roomId: number,
  status: "clean" | "dirty" | "out_of_order",
) {
  await query(`UPDATE rooms SET status = $1 WHERE id = $2`, [status, roomId])
  revalidatePath("/housekeeping")
  revalidatePath("/inventory")
  revalidatePath("/", "layout")
}

/* ------------------------------------------------------------------ */
/* Add-on manager                                                     */
/* ------------------------------------------------------------------ */

export async function createAddon(input: {
  propertyId: number
  name: string
  price: number
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: "Add-on name is required." }
  if (!(input.price >= 0)) return { ok: false, error: "Price must be zero or greater." }
  await query(`INSERT INTO addons (property_id, name, price) VALUES ($1,$2,$3)`, [
    input.propertyId,
    name,
    input.price,
  ])
  revalidatePath("/pricing")
  return { ok: true }
}

export async function updateAddon(input: {
  id: number
  name: string
  price: number
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: "Add-on name is required." }
  if (!(input.price >= 0)) return { ok: false, error: "Price must be zero or greater." }
  await query(`UPDATE addons SET name = $1, price = $2 WHERE id = $3`, [name, input.price, input.id])
  revalidatePath("/pricing")
  return { ok: true }
}

export async function deleteAddon(addonId: number) {
  await query(`DELETE FROM addons WHERE id = $1`, [addonId])
  revalidatePath("/pricing")
}

/* ------------------------------------------------------------------ */
/* Reservation cancellation                                           */
/* ------------------------------------------------------------------ */

export async function cancelReservation(reservationId: number) {
  await withConnection(async (client) => {
    await client.query(`UPDATE reservations SET status = 'cancelled' WHERE id = $1`, [reservationId])
    await client.query(`UPDATE stays SET status = 'cancelled' WHERE reservation_id = $1`, [reservationId])
    // Release any rooms that were held/occupied by this reservation back to clean.
    await client.query(
      `UPDATE rooms SET status = 'clean'
       WHERE status = 'occupied'
         AND id IN (SELECT room_id FROM stays WHERE reservation_id = $1)`,
      [reservationId],
    )
  })
  revalidatePath("/", "layout")
  revalidatePath("/reservations")
}

/* ------------------------------------------------------------------ */
/* Rate Plans CRUD                                                    */
/* ------------------------------------------------------------------ */

export interface CreateRatePlanInput {
  propertyId: number
  name: string
  description: string
  adjustmentType: "percentage" | "fixed"
  adjustmentValue: number
  includesBreakfast: boolean
  refundable: boolean
}

export async function createRatePlan(input: CreateRatePlanInput): Promise<{ ok: boolean; error?: string; id?: number }> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: "Rate Plan name is required." }
  if (!Number.isFinite(input.adjustmentValue)) {
    return { ok: false, error: "Adjustment value must be a valid number." }
  }

  try {
    const res = await query<{ id: number }>(
      `INSERT INTO rate_plans (property_id, name, description, adjustment_type, adjustment_value, includes_breakfast, refundable)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        input.propertyId,
        name,
        input.description.trim() || null,
        input.adjustmentType,
        input.adjustmentValue,
        input.includesBreakfast,
        input.refundable,
      ],
    )
    revalidatePath("/pricing")
    return { ok: true, id: res.rows[0]?.id }
  } catch (err) {
    return { ok: false, error: "Failed to create rate plan." }
  }
}

export interface UpdateRatePlanInput {
  id: number
  propertyId: number
  name: string
  description: string
  adjustmentType: "percentage" | "fixed"
  adjustmentValue: number
  includesBreakfast: boolean
  refundable: boolean
}

export async function updateRatePlan(input: UpdateRatePlanInput): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: "Rate Plan name is required." }
  if (!Number.isFinite(input.adjustmentValue)) {
    return { ok: false, error: "Adjustment value must be a valid number." }
  }

  try {
    await query(
      `UPDATE rate_plans
       SET name = $1, description = $2, adjustment_type = $3, adjustment_value = $4, includes_breakfast = $5, refundable = $6
       WHERE id = $7 AND property_id = $8`,
      [
        name,
        input.description.trim() || null,
        input.adjustmentType,
        input.adjustmentValue,
        input.includesBreakfast,
        input.refundable,
        input.id,
        input.propertyId,
      ],
    )
    revalidatePath("/pricing")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: "Failed to update rate plan." }
  }
}

export async function deleteRatePlan(id: number, propertyId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await query(`DELETE FROM rate_plans WHERE id = $1 AND property_id = $2`, [id, propertyId])
    revalidatePath("/pricing")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: "Failed to delete rate plan." }
  }
}

/* ------------------------------------------------------------------ */
/* Staff Status Management                                            */
/* ------------------------------------------------------------------ */

/**
 * Mark a staff member as active when they first log in.
 * This is called after successful Auth0 authentication.
 * Only marks as active if they were previously in 'invited' status.
 */
export async function markStaffAsActive(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await query(
      `UPDATE staff SET status = 'active' WHERE email = $1 AND status = 'invited' RETURNING id`,
      [email.toLowerCase()],
    )

    if (result.rowCount && result.rowCount > 0) {
      revalidatePath("/settings/staff")
      return { ok: true }
    }

    return { ok: true } // Idempotent - return success if already active
  } catch (err) {
    console.error("[markStaffAsActive] Error updating staff status:", err)
    return { ok: false, error: "Failed to update staff status." }
  }
}

/**
 * Submit a guest rating after check-in or stay completion.
 * Saves feedback to the database for property management and improvement tracking.
 */
export async function submitGuestRating(
  reservationId: number,
  ratingType: "check_in" | "stay",
  stars: number,
  feedbackTags: string[],
  comment: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Validate inputs
    if (!reservationId || stars < 1 || stars > 5) {
      return { ok: false, error: "Invalid rating data" }
    }

    // Get reservation to find property_id
    const resRes = await query(
      `SELECT property_id FROM reservations WHERE id = $1`,
      [reservationId],
    )

    if (!resRes.rows || resRes.rows.length === 0) {
      return { ok: false, error: "Reservation not found" }
    }

    const propertyId = (resRes.rows[0] as { property_id: number }).property_id

    // Upsert — unique index on (reservation_id, rating_type) handles duplicates
    await query(
      `INSERT INTO guest_ratings (reservation_id, property_id, rating_type, stars, feedback_tags, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (reservation_id, rating_type)
       DO UPDATE SET
         stars         = EXCLUDED.stars,
         feedback_tags = EXCLUDED.feedback_tags,
         comment       = EXCLUDED.comment`,
      [reservationId, propertyId, ratingType, stars, feedbackTags, comment],
    )

    revalidatePath("/", "layout")
    return { ok: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[submitGuestRating] Error saving rating:", errorMessage)
    return { ok: false, error: "Failed to submit rating" }
  }
}

// ---------------------------------------------------------------------------
// Onboarding Wizard — creates a complete property in one atomic transaction
// ---------------------------------------------------------------------------

export type RoomCategoryInput = {
  name: string
  roomCount: number
  baseRate: number
}

export type OnboardNewPropertyInput = {
  // Step 1 — Property Identity
  name: string
  city: string
  currency: string
  timezone: string
  logoUrl?: string | null
  // Creator's Clerk email — used by the Portal to scope "Your Properties"
  creatorEmail: string
  // Step 2+3 — Room categories with counts and base rates
  categories: RoomCategoryInput[]
}

export async function onboardNewProperty(
  input: OnboardNewPropertyInput,
): Promise<{ ok: boolean; propertyId?: number; error?: string }> {
  try {
    const result = await withConnection(async (client) => {
      await client.query("BEGIN")

      // 1. Create the property
      const propRes = await client.query<{ id: number }>(
        `INSERT INTO properties (name, city, currency, timezone, logo_url, creator_email, tax_rate)
         VALUES ($1, $2, $3, $4, $5, $6, 0)
         RETURNING id`,
        [input.name, input.city, input.currency, input.timezone, input.logoUrl ?? null, input.creatorEmail],
      )
      const propertyId = propRes.rows[0].id

      // 2. Create the creator as the first Admin staff member
      await client.query(
        `INSERT INTO staff (property_id, full_name, email, role, status, permissions)
         VALUES ($1, $2, $3, 'admin', 'active', '{}'::jsonb)`,
        [propertyId, input.creatorEmail.split("@")[0], input.creatorEmail],
      )

      // 3. Default rate plans (Flexible + Non-Refundable)
      await client.query(
        `INSERT INTO rate_plans (property_id, name, description, adjustment_type, adjustment_value, includes_breakfast, refundable)
         VALUES
           ($1, 'Flexible Rate',       'Free cancellation up to 24h before arrival', 'percentage', 0,   false, true),
           ($1, 'Non-Refundable Rate', '10% discount, no cancellation',               'percentage', -10, false, false)`,
        [propertyId],
      )

      // 4. For each room category: room_group + rooms + 30-day rate calendar
      for (const cat of input.categories) {
        // Room group
        const groupRes = await client.query<{ id: number }>(
          `INSERT INTO room_groups (property_id, name, base_capacity, max_capacity)
           VALUES ($1, $2, 2, 4) RETURNING id`,
          [propertyId, cat.name],
        )
        const groupId = groupRes.rows[0].id

        // Physical rooms (numbered sequentially per category)
        for (let i = 1; i <= cat.roomCount; i++) {
          const roomNumber = `${cat.name.slice(0, 1).toUpperCase()}${String(i).padStart(2, "0")}`
          await client.query(
            `INSERT INTO rooms (room_group_id, room_number, floor, status) VALUES ($1, $2, $3, 'clean')`,
            [groupId, roomNumber, Math.ceil(i / 5)],
          )
        }

        // 30-day rate calendar seeded from the wizard's base rate
        await client.query(
          `INSERT INTO rate_calendars (room_group_id, stay_date, base_rate)
           SELECT $1, (CURRENT_DATE + s)::date, $2
           FROM generate_series(0, 29) AS s
           ON CONFLICT (room_group_id, stay_date) DO NOTHING`,
          [groupId, cat.baseRate],
        )
      }

      await client.query("COMMIT")
      return propertyId
    })

    return { ok: true, propertyId: result as number }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[onboardNewProperty] Error:", errorMessage)
    return { ok: false, error: errorMessage }
  }
}

// ---------------------------------------------------------------------------
// Stripe Connect — per-property onboarding and payment intents
// ---------------------------------------------------------------------------

/**
 * Creates (or reuses) a Stripe Express connected account for the active
 * property and returns a one-time Account Link URL for onboarding.
 */
export async function getStripeOnboardingLink(): Promise<{
  ok: boolean
  url?: string
  error?: string
}> {
  try {
    const { stripe } = await import("@/lib/stripe")
    const { getActiveProperty } = await import("@/lib/property")
    const property = await getActiveProperty()

    let accountId = property.stripe_account_id

    // Create a new Express connected account if none exists yet
    if (!accountId) {
      const account = await stripe.accounts.create({
        controller: {
          stripe_dashboard: { type: "express" },
          fees: { payer: "application" },
          losses: { payments: "application" },
          requirement_collection: "stripe",
        },
        metadata: { property_id: String(property.id), property_name: property.name },
      })
      accountId = account.id

      // Persist the account ID immediately so retries reuse it
      await query(
        `UPDATE properties SET stripe_account_id = $1 WHERE id = $2`,
        [accountId, property.id],
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/settings/payments?refresh=1`,
      return_url: `${appUrl}/settings/payments?success=1`,
      type: "account_onboarding",
    })

    return { ok: true, url: link.url }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[getStripeOnboardingLink] Error:", errorMessage)
    return { ok: false, error: errorMessage }
  }
}

/**
 * Creates a Stripe PaymentIntent for an invoice, routing funds to the
 * property's connected account via destination charges.
 * Returns the client_secret for use with Stripe.js on the client.
 */
export async function createPaymentIntent(
  invoiceId: number,
): Promise<{ ok: boolean; clientSecret?: string; error?: string }> {
  try {
    const { stripe } = await import("@/lib/stripe")

    // Fetch invoice + reservation + property in one query
    const res = await query<{
      total: number
      currency: string
      stripe_account_id: string | null
      stripe_onboarding_complete: boolean
    }>(
      `SELECT i.total, p.currency, p.stripe_account_id, p.stripe_onboarding_complete
       FROM invoices i
       JOIN reservations r ON r.id = i.reservation_id
       JOIN properties p   ON p.id = r.property_id
       WHERE i.id = $1`,
      [invoiceId],
    )

    if (!res.rows.length) {
      return { ok: false, error: "Invoice not found" }
    }

    const { total, currency, stripe_account_id, stripe_onboarding_complete } = res.rows[0]

    if (!stripe_account_id || !stripe_onboarding_complete) {
      return { ok: false, error: "Property has not completed Stripe onboarding" }
    }

    // Amounts are stored as decimals; Stripe expects integer cents
    const amountCents = Math.round(total * 100)
    // Platform fee: 2% of the transaction
    const applicationFeeCents = Math.round(amountCents * 0.02)

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      transfer_data: { destination: stripe_account_id },
      application_fee_amount: applicationFeeCents,
      metadata: { invoice_id: String(invoiceId) },
    })

    return { ok: true, clientSecret: intent.client_secret ?? undefined }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[createPaymentIntent] Error:", errorMessage)
    return { ok: false, error: errorMessage }
  }
}

/**
 * Manual fallback for when the 'account.updated' webhook hasn't arrived yet.
 * Retrieves the Stripe account directly and marks stripe_onboarding_complete
 * in the DB if charges_enabled is true, then revalidates the payments page.
 */
export async function verifyStripeStatus(
  propertyId: number,
): Promise<{ ok: boolean; complete: boolean; error?: string }> {
  try {
    const { stripe } = await import("@/lib/stripe")

    const res = await query<{ stripe_account_id: string | null }>(
      `SELECT stripe_account_id FROM properties WHERE id = $1`,
      [propertyId],
    )

    const accountId = res.rows[0]?.stripe_account_id
    if (!accountId) {
      return { ok: false, complete: false, error: "No Stripe account linked to this property" }
    }

    const account = await stripe.accounts.retrieve(accountId)
    const complete =
      account.charges_enabled === true &&
      account.payouts_enabled === true &&
      account.details_submitted === true

    if (complete) {
      await query(
        `UPDATE properties SET stripe_onboarding_complete = true WHERE id = $1`,
        [propertyId],
      )
      revalidatePath("/settings/payments")
    }

    return { ok: true, complete }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[verifyStripeStatus] Error:", errorMessage)
    return { ok: false, complete: false, error: errorMessage }
  }
}
