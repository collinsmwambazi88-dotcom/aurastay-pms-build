import { auth, currentUser } from "@clerk/nextjs/server"
import { query } from "@/lib/db"
import type { StaffRole } from "@/lib/types"
import {
  type PermissionKey,
  roleDefaults,
  normalizePermissions,
  isPermissionKey,
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

  // Admins and managers always get full access — skip the DB lookup.
  if (meta.role === "admin" || meta.role === "manager") {
    return normalizePermissions(roleDefaults(meta.role))
  }

  // Start with the static role defaults as the base layer.
  const base: PermissionMap = meta.role ? normalizePermissions(roleDefaults(meta.role)) : {}

  // If we have a staff_id, fetch the JSONB overrides from the DB and merge
  // them on top. An explicit true/false in the DB always wins; keys absent
  // from the DB object fall back to the role default above.
  if (meta.staff_id) {
    try {
      const res = await query<{ permissions: unknown; raw_perms: string }>(
        `SELECT permissions FROM staff WHERE id = $1 LIMIT 1`,
        [meta.staff_id],
      )
      const row = res.rows[0]
      if (row && row.permissions && typeof row.permissions === "object") {
        const dbPerms = row.permissions as Record<string, unknown>
        // Only override keys that are explicitly present in the DB object.
        for (const key of Object.keys(dbPerms) as PermissionKey[]) {
          if (isPermissionKey(key)) {
            base[key] = Boolean(dbPerms[key])
          }
        }
      }
    } catch (err) {
      console.error("[getEffectivePermissions] DB lookup failed, using role defaults only:", err)
    }
  }

  return base
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
