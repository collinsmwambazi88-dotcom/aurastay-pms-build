import { headers } from "next/headers"
import { Webhook } from "svix"
import { clerkClient } from "@clerk/nextjs/server"
import { query } from "@/lib/db"

type ClerkUserCreatedEvent = {
  type: "user.created"
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
  }
}

type WebhookEvent = ClerkUserCreatedEvent | { type: string; data: unknown }

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 })
  }

  // Verify signature with svix
  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(secret)

  let event: WebhookEvent
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent
  } catch {
    return new Response("Invalid webhook signature", { status: 400 })
  }

  // Only process user.created events
  if (event.type !== "user.created") {
    return new Response("OK", { status: 200 })
  }

  const { id: clerkUserId, email_addresses, primary_email_address_id } = event.data as {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
  }

  const primaryEmail = email_addresses.find(
    (e) => e.id === primary_email_address_id,
  )?.email_address

  if (!primaryEmail) {
    return new Response("No primary email found", { status: 200 })
  }

  // Look up if this email matches an invited staff member
  const staffRes = await query(
    `SELECT id, property_id, role, permissions
     FROM staff
     WHERE LOWER(email) = LOWER($1) AND status = 'invited'
     LIMIT 1`,
    [primaryEmail],
  )

  if (!staffRes.rows || staffRes.rows.length === 0) {
    // Not an invited staff member — nothing to sync
    return new Response("OK", { status: 200 })
  }

  const staff = staffRes.rows[0] as {
    id: number
    property_id: number
    role: string
    permissions: Record<string, boolean>
  }

  // Set Clerk public metadata with role and property_id for RBAC
  const client = await clerkClient()
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      role: staff.role,
      property_id: staff.property_id,
      staff_id: staff.id,
    },
  })

  // Mark staff as active now that they have signed up
  await query(
    `UPDATE staff SET status = 'active' WHERE id = $1`,
    [staff.id],
  )

  return new Response("OK", { status: 200 })
}
