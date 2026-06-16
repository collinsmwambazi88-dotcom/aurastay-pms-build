import type { StaffRole } from "@/lib/types"

/**
 * Granular B2B permission keys, namespaced by domain.
 * The string values are persisted in the staff.permissions JSONB column,
 * so renaming a key requires a data migration.
 */
export type PermissionKey =
  | "reservations.view"
  | "reservations.create"
  | "reservations.cancel"
  | "reservations.modify"
  | "billing.invoices"
  | "billing.payments"
  | "billing.custom_charges"
  | "stays.check_in"
  | "stays.check_out"
  | "stays.room_changes"
  | "housekeeping.cleaning"
  | "revenue.kpis"
  | "revenue.market"
  | "rates.calendar"
  | "rates.plans"

export type PermissionMap = Partial<Record<PermissionKey, boolean>>

export interface PermissionDef {
  key: PermissionKey
  label: string
  description: string
}

export interface PermissionCategory {
  /** Stable id, also used to pick an icon in the UI. */
  id: "reservations" | "billing" | "stays" | "housekeeping" | "revenue" | "rates"
  label: string
  description: string
  permissions: PermissionDef[]
}

export const PERMISSION_CATALOG: PermissionCategory[] = [
  {
    id: "reservations",
    label: "Reservations",
    description: "Manage the booking lifecycle.",
    permissions: [
      { key: "reservations.view", label: "View", description: "See reservations and the calendar." },
      { key: "reservations.create", label: "Create", description: "Take new bookings." },
      { key: "reservations.modify", label: "Modify", description: "Edit dates, rooms and guest details." },
      { key: "reservations.cancel", label: "Cancel", description: "Cancel existing reservations." },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    description: "Folios, invoices and payments.",
    permissions: [
      { key: "billing.invoices", label: "Invoices", description: "View and issue guest invoices." },
      { key: "billing.payments", label: "Payments", description: "Record and settle payments." },
      { key: "billing.custom_charges", label: "Custom Charges", description: "Post incidental folio charges." },
    ],
  },
  {
    id: "stays",
    label: "Stays",
    description: "Front-desk operations.",
    permissions: [
      { key: "stays.check_in", label: "Check-in", description: "Check arriving guests in." },
      { key: "stays.check_out", label: "Check-out", description: "Check departing guests out." },
      { key: "stays.room_changes", label: "Room Changes", description: "Reassign guests to other rooms." },
    ],
  },
  {
    id: "housekeeping",
    label: "Housekeeping",
    description: "Room readiness.",
    permissions: [
      { key: "housekeeping.cleaning", label: "Cleaning Status", description: "Update room cleaning status." },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    description: "Sensitive financial insight.",
    permissions: [
      { key: "revenue.kpis", label: "Financial KPIs", description: "See occupancy, ADR and RevPAR." },
      { key: "revenue.market", label: "Market Intel", description: "See competitor and market data." },
    ],
  },
  {
    id: "rates",
    label: "Rates",
    description: "Pricing controls.",
    permissions: [
      { key: "rates.calendar", label: "Rate Calendar", description: "Edit nightly base rates." },
      { key: "rates.plans", label: "Rate Plans", description: "Create and edit rate plans." },
    ],
  },
]

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_CATALOG.flatMap((c) =>
  c.permissions.map((p) => p.key),
)

export const PERMISSION_COUNT = ALL_PERMISSION_KEYS.length

export function isPermissionKey(value: string): value is PermissionKey {
  return (ALL_PERMISSION_KEYS as string[]).includes(value)
}

/** Default permission set granted when a member is assigned a role. */
export function roleDefaults(role: StaffRole): Record<PermissionKey, boolean> {
  const grant = (keys: PermissionKey[]): Record<PermissionKey, boolean> => {
    const map = {} as Record<PermissionKey, boolean>
    for (const key of ALL_PERMISSION_KEYS) map[key] = keys.includes(key)
    return map
  }

  if (role === "admin") return grant(ALL_PERMISSION_KEYS)

  // Front desk: day-to-day operations, no financials or pricing by default.
  return grant([
    "reservations.view",
    "reservations.create",
    "reservations.modify",
    "billing.invoices",
    "billing.custom_charges",
    "stays.check_in",
    "stays.check_out",
    "housekeeping.cleaning",
  ])
}

export function hasPermission(map: PermissionMap | null | undefined, key: PermissionKey): boolean {
  return Boolean(map?.[key])
}

export function countGranted(map: PermissionMap | null | undefined): number {
  if (!map) return 0
  return ALL_PERMISSION_KEYS.reduce((n, key) => (map[key] ? n + 1 : n), 0)
}

/** Normalize an arbitrary stored object into a full, typed permission map. */
export function normalizePermissions(raw: unknown): PermissionMap {
  const map: PermissionMap = {}
  if (raw && typeof raw === "object") {
    for (const key of ALL_PERMISSION_KEYS) {
      map[key] = Boolean((raw as Record<string, unknown>)[key])
    }
  }
  return map
}
