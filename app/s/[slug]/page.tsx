import { notFound } from "next/navigation"
import { getPropertyBySlug } from "@/lib/property"
import { query } from "@/lib/db"
import { PublicStorefront } from "@/components/website/public-storefront"
import type { RoomGroup } from "@/lib/types"

export const revalidate = 3600 // ISR: revalidate hourly

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const property = await getPropertyBySlug(slug)

  if (!property) {
    return { title: "Hotel Not Found" }
  }

  return {
    title: `${property.name} | AuraStay Direct Booking`,
    description: property.website_config?.heroSubtitle || `Book your stay at ${property.name}`,
    openGraph: {
      title: property.name,
      description: property.website_config?.heroSubtitle || `Book your stay at ${property.name}`,
      type: "website",
    },
  }
}

export default async function PublicStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const property = await getPropertyBySlug(slug)

  if (!property || !property.website_config) {
    notFound()
  }

  // Fetch room groups with availability
  const roomsRes = await query<RoomGroup>(
    `SELECT id, property_id, name, description, base_capacity, max_capacity, image_url
     FROM room_groups WHERE property_id = $1 ORDER BY id`,
    [property.id],
  )

  return (
    <PublicStorefront
      property={property}
      config={property.website_config}
      roomGroups={roomsRes.rows}
    />
  )
}
