import { cookies } from "next/headers"
import { query } from "@/lib/db"
import type { Property } from "@/lib/types"

const COOKIE = "aura_property"

export async function getProperties(): Promise<Property[]> {
  const res = await query<Property>(
    `SELECT id, name, city, currency, timezone FROM properties ORDER BY id`,
  )
  return res.rows
}

/** Resolve the active property from the cookie, falling back to the first one. */
export async function getActiveProperty(): Promise<Property> {
  const properties = await getProperties()
  const cookieStore = await cookies()
  const selected = Number(cookieStore.get(COOKIE)?.value)
  return properties.find((p) => p.id === selected) ?? properties[0]
}

export const PROPERTY_COOKIE = COOKIE
