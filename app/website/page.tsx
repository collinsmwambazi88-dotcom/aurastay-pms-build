import { redirect } from "next/navigation"
import { AppShell } from "@/components/shell/app-shell"
import { WebsiteBuilder } from "@/components/website/website-builder"
import { getActiveProperty } from "@/lib/property"
import { hasRole } from "@/lib/auth-utils"
import { query } from "@/lib/db"
import type { WebsiteConfig, RoomGroup } from "@/lib/types"

export const metadata = {
  title: "Website Builder",
  description: "Build your hotel website",
}

export default async function WebsitePage() {
  // Admin-only
  if (!(await hasRole("admin"))) {
    redirect("/unauthorized")
  }

  const property = await getActiveProperty()

  // Fetch room groups for this property
  const roomsRes = await query<RoomGroup>(
    `SELECT id, property_id, name, description, base_capacity, max_capacity, image_url
     FROM room_groups WHERE property_id = $1 ORDER BY id`,
    [property.id],
  )
  const roomGroups = roomsRes.rows

  const initialConfig: WebsiteConfig = property.website_config ?? {
    heroTitle: `Welcome to ${property.name}`,
    heroSubtitle: "Experience luxury and comfort",
    heroImageUrl: property.logo_url,
    primaryColor: "#4f46e5", // AuraStay Indigo
    aboutUsContent: `About ${property.name}\n\nShare your hotel's unique story and charm.`,
  }

  return (
    <AppShell title="Website Builder">
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {property.custom_slug && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-green-800">
              Your public site is live at{" "}
              <span className="font-mono font-semibold">auraustay.example.com/s/{property.custom_slug}</span>
            </p>
            <a
              href={`/s/${property.custom_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-700 hover:text-green-900 underline"
            >
              View Site →
            </a>
          </div>
        )}
        <WebsiteBuilder
          initialConfig={initialConfig}
          propertyId={property.id}
          propertyName={property.name}
          customSlug={property.custom_slug}
          roomGroups={roomGroups}
        />
      </div>
    </AppShell>
  )
}
