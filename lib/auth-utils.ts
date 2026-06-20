import { auth, currentUser } from "@clerk/nextjs/server"
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
 * Permissions are resolved from the role defaults — the granular JSONB
 * overrides stored in the staff table are authoritative in the DB queries,
 * but for fast server-side page guards we derive from the role.
 */
export async function getEffectivePermissions(): Promise<PermissionMap> {
  const role = await getStaffRole()
  if (!role) return {}
  return normalizePermissions(roleDefaults(role))
}

/**
 * Returns true if the current user has the given permission key.
 */
export async function hasPermission(key: PermissionKey): Promise<boolean> {
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
