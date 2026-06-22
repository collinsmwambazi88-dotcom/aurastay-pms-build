import { cookies } from "next/headers"
import { query } from "@/lib/db"
import type { Property } from "@/lib/types"
import { getClerkPropertyId } from "@/lib/auth-utils"

const COOKIE = "aura_property"

export async function getProperties(): Promise<Property[]> {
  const res = await query<Property>(
    `SELECT id, name, city, currency, timezone, logo_url, tax_rate::float8 AS tax_rate,
            creator_email, stripe_account_id, stripe_onboarding_complete, website_config, custom_slug
     FROM properties ORDER BY id`,
  )
  return res.rows
}

/**
 * Resolve the active property with a three-tier priority:
 * 1. Cookie ("aura_property") — explicit user selection always wins, so owners
 *    and multi-property staff can switch freely via the Portal or PropertySwitcher.
 * 2. Clerk user metadata property_id — default for staff who have never
 *    explicitly chosen a property (first login, no cookie yet).
 * 3. First property in the database (fallback).
 */
export async function getActiveProperty(): Promise<Property> {
  const properties = await getProperties()

  // Tier 1: Cookie — respects the user's explicit "Manage" / switcher choice
  const cookieStore = await cookies()
  const selected = Number(cookieStore.get(COOKIE)?.value)
  const fromCookie = properties.find((p) => p.id === selected)
  if (fromCookie) return fromCookie

  // Tier 2: Clerk metadata — automatic default for assigned staff on first load
  const clerkPropertyId = await getClerkPropertyId()
  if (clerkPropertyId) {
    const matched = properties.find((p) => p.id === clerkPropertyId)
    if (matched) return matched
  }

  // Tier 3: First available property
  return properties[0]
}

export const PROPERTY_COOKIE = COOKIE

/** Fetch a property by its public custom_slug for storefront rendering. */
export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const res = await query<Property>(
    `SELECT id, name, city, currency, timezone, logo_url, tax_rate::float8 AS tax_rate,
            creator_email, stripe_account_id, stripe_onboarding_complete, website_config, custom_slug
     FROM properties WHERE LOWER(custom_slug) = LOWER($1)`,
    [slug],
  )
  return res.rows[0] ?? null
}
