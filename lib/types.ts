export type RoomStatus = "clean" | "occupied" | "dirty" | "out_of_order"
export type ReservationStatus = "confirmed" | "checked_in" | "checked_out" | "cancelled"
export type InvoiceStatus = "paid" | "overdue" | "pending"
export type AdjustmentType = "percentage" | "fixed"
export type LineItemType = "room" | "addon" | "tax" | "fee"
export type StaffRole = "admin" | "front_desk"
export type StaffStatus = "active" | "invited"

export interface Property {
  id: number
  name: string
  city: string
  currency: string
  timezone: string
  logo_url: string | null
  /** Sales/occupancy tax rate as a percentage (e.g. 12.5 = 12.5%). */
  tax_rate: number
}

export interface Staff {
  id: number
  property_id: number
  full_name: string
  email: string
  role: StaffRole
  status: StaffStatus
  /** Granular permission map keyed by PermissionKey (see lib/permissions.ts). */
  permissions: import("@/lib/permissions").PermissionMap
}

/** A room enriched with its group name, for the inventory table. */
export interface RoomWithGroup extends Room {
  group_name: string
}

/** A room awaiting housekeeping, with category + occupancy context. */
export interface HousekeepingRoom extends RoomWithGroup {
  /** Guest currently/last occupying the room, if any. */
  current_guest: string | null
  /** Most recent checkout date for the room, if any. */
  last_checkout: string | null
}

/** A guest enriched with lifetime stats for the guest database. */
export interface GuestWithStats extends Guest {
  total_stays: number
  total_nights: number
  lifetime_value: number
  last_stay: string | null
}

export interface RoomGroup {
  id: number
  property_id: number
  name: string
  description: string | null
  base_capacity: number
  max_capacity: number
}

export interface Room {
  id: number
  room_group_id: number
  room_number: string
  floor: number
  status: RoomStatus
}

export interface RatePlan {
  id: number
  property_id: number
  name: string
  description: string | null
  adjustment_type: AdjustmentType
  adjustment_value: number
  includes_breakfast: boolean
  refundable: boolean
}

export interface Addon {
  id: number
  property_id: number
  name: string
  price: number
}

export interface Guest {
  id: number
  property_id: number
  full_name: string
  email: string | null
  phone: string | null
  id_type: string | null
  id_number: string | null
}

export interface Stay {
  id: number
  reservation_id: number
  room_id: number
  room_group_id: number
  check_in: string
  check_out: string
  nightly_rate: number
  guests_count: number
  status: ReservationStatus
}

export interface Reservation {
  id: number
  property_id: number
  guest_id: number
  rate_plan_id: number | null
  status: ReservationStatus
  check_in: string
  check_out: string
  created_at: string
}

export interface InvoiceLineItem {
  id: number
  invoice_id: number
  description: string
  item_type: LineItemType
  quantity: number
  unit_price: number
  amount: number
}

export interface Invoice {
  id: number
  reservation_id: number
  status: InvoiceStatus
  total: number
}

/** Stay enriched with room + guest context, used by the Gantt grid. */
export interface GanttStay {
  stay_id: number
  reservation_id: number
  room_id: number
  room_group_id: number
  room_number: string
  group_name: string
  guest_name: string
  status: ReservationStatus
  check_in: string
  check_out: string
  nightly_rate: number
  guests_count: number
}

export interface MarketPoint {
  stay_date: string
  our_price: number
  competitor_price: number
}
