import { cookies } from "next/headers"
import { query } from "@/lib/db"
import type { Property } from "@/lib/types"
import { getClerkPropertyId } from "@/lib/auth-utils"

const COOKIE = "aura_property"

export async function getProperties(): Promise<Property[]> {
  const res = await query<Property>(
    `SELECT id, name, city, currency, timezone, logo_url, tax_rate::float8 AS tax_rate
     FROM properties ORDER BY id`,
  )
  return res.rows
}

/**
 * Resolve the active property with a three-tier priority:
 * 1. Clerk user metadata property_id (staff assigned to a specific property)
 * 2. Cookie override (admin switching properties via the PropertySwitcher)
 * 3. First property in the database (fallback)
 */
export async function getActiveProperty(): Promise<Property> {
  const properties = await getProperties()

  // Tier 1: Clerk metadata — staff see their assigned property automatically
  const clerkPropertyId = await getClerkPropertyId()
  if (clerkPropertyId) {
    const matched = properties.find((p) => p.id === clerkPropertyId)
    if (matched) return matched
  }

  // Tier 2: Cookie override (admins switching between properties)
  const cookieStore = await cookies()
  const selected = Number(cookieStore.get(COOKIE)?.value)
  const fromCookie = properties.find((p) => p.id === selected)
  if (fromCookie) return fromCookie

  // Tier 3: First available property
  return properties[0]
}

export const PROPERTY_COOKIE = COOKIE
