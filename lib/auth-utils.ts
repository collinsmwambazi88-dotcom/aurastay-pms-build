import { auth, currentUser } from "@clerk/nextjs/server"
import { query } from "@/lib/db"
import type { StaffRole } from "@/lib/types"
import {
  type PermissionKey,
  roleDefaults,
  normalizePermissions,
  type PermissionMap,
} from "@/lib/permissions"

/**
 * Shape of the public metadata stored on the Clerk user object.
 * Set by the user.created webhook when a staff invite is matched.
 */
export interface ClerkStaffMetadata {
  role?: StaffRole
  property_id?: number
  staff_id?: number
}

/**
 * Retrieve the authenticated user's staff metadata from Clerk.
 * Returns null if the user is not authenticated or has no metadata.
 */
export async function getStaffMetadata(): Promise<ClerkStaffMetadata | null> {
  const user = await currentUser()
  if (!user) return null
  return (user.publicMetadata as ClerkStaffMetadata) ?? null
}

/**
 * Returns the authenticated user's StaffRole, or null if unauthenticated
 * or if the user has not been matched to a staff record yet.
 */
export async function getStaffRole(): Promise<StaffRole | null> {
  const meta = await getStaffMetadata()
  return meta?.role ?? null
}

/**
 * Returns the effective permission map for the current user.
 *
 * Resolution order (first match wins):
 *   1. If the user's role is "admin" → full access (all permissions granted).
 *   2. If the user has a staff_id in Clerk metadata → query staff.permissions
 *      from the DB; this is the authoritative JSONB column that contains any
 *      granular overrides set via the Staff Access UI.
 *   3. Fallback: derive from role defaults (covers users who signed up but
 *      whose staff row hasn't been written yet — should be rare in production).
 */
export async function getEffectivePermissions(): Promise<PermissionMap> {
  const meta = await getStaffMetadata()
  if (!meta) return {}

  // Admins always get full access — skip the DB lookup.
  if (meta.role === "admin") {
    return normalizePermissions(roleDefaults("admin"))
  }

  // If we have a staff_id, load the authoritative permissions from the DB.
  if (meta.staff_id) {
    try {
      const res = await query<{ permissions: unknown }>(
        `SELECT permissions FROM staff WHERE id = $1 LIMIT 1`,
        [meta.staff_id],
      )
      const row = res.rows[0]
      if (row) {
        // If the stored permissions map is empty ({}), fall back to role
        // defaults so a newly-invited staff member isn't locked out before
        // an admin has configured their custom permissions.
        const stored = normalizePermissions(row.permissions)
        const hasAnyGrant = Object.values(stored).some(Boolean)
        if (hasAnyGrant) return stored
      }
    } catch (err) {
      console.error("[getEffectivePermissions] DB lookup failed, falling back to role defaults:", err)
    }
  }

  // Fallback: role-based defaults.
  if (meta.role) return normalizePermissions(roleDefaults(meta.role))
  return {}
}

/**
 * Returns true if the current user has the given permission key.
 * Admins always return true regardless of the key.
 */
export async function hasPermission(key: PermissionKey): Promise<boolean> {
  const meta = await getStaffMetadata()
  if (meta?.role === "admin") return true
  const perms = await getEffectivePermissions()
  return Boolean(perms[key])
}

/**
 * Returns true if the current user's role is in the allowed list.
 */
export async function hasRole(...allowed: StaffRole[]): Promise<boolean> {
  const role = await getStaffRole()
  if (!role) return false
  return (allowed as string[]).includes(role)
}

/**
 * Returns the property_id from the Clerk user metadata.
 * Falls back to null if not set (e.g. admin with no assigned property yet).
 */
export async function getClerkPropertyId(): Promise<number | null> {
  const meta = await getStaffMetadata()
  return meta?.property_id ?? null
}

/**
 * Lightweight helper for use in server components that need the raw Clerk
 * userId without loading the full user object.
 */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
