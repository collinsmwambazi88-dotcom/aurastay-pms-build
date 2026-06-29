import { NextResponse } from "next/server"
import { clerkClient } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"
import { query } from "@/lib/db"
import { PROPERTY_COOKIE } from "@/lib/property"
import { roleDefaults } from "@/lib/permissions"

// Full superadmin permission map — every permission key set to true
const SUPERADMIN_PERMISSIONS = Object.fromEntries(
  Object.keys(roleDefaults("admin")).map((k) => [k, true]),
)

export async function GET() {
  try {
    // Look up Collos Palace by name (case-insensitive)
    const propRes = await query<{ id: number }>(
      `SELECT id FROM properties WHERE LOWER(name) LIKE LOWER('%collos%') LIMIT 1`,
    )
    const property = propRes.rows[0]
    if (!property) {
      return NextResponse.json({ error: "Collos Palace property not found" }, { status: 404 })
    }
    const propertyId = property.id

    // If the judge is authenticated, upgrade their Clerk metadata to superadmin
    const { userId } = await auth()
    if (userId) {
      const clerk = await clerkClient()
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          role: "admin",
          staff_id: null,
          property_id: propertyId,
          is_judge: true,
          permissions: SUPERADMIN_PERMISSIONS,
        },
      })
    }

    // Set the property cookie and redirect to dashboard with judge flag
    const response = NextResponse.redirect(
      new URL(`/dashboard?judge=1`, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    )
    response.cookies.set(PROPERTY_COOKIE, String(propertyId), {
      path: "/",
      maxAge: 60 * 60 * 24, // 24h — expires after the hackathon demo session
    })

    return response
  } catch (err) {
    console.error("[judge-access] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
