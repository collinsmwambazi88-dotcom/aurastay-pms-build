import Link from "next/link"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import {
  Building2,
  Hotel,
  MapPin,
  Plus,
  ExternalLink,
  Users,
  UserCircle,
  LogOut,
} from "lucide-react"
import { query } from "@/lib/db"
import { setActiveProperty } from "@/lib/actions"
import type { Property } from "@/lib/types"

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function getOwnedProperties(email: string): Promise<Property[]> {
  const res = await query<Property>(
    `SELECT id, name, city, currency, timezone, logo_url,
            tax_rate::float8 AS tax_rate, creator_email
     FROM properties WHERE creator_email = $1 ORDER BY created_at DESC`,
    [email],
  )
  return res.rows
}

async function getStaffProperties(email: string): Promise<(Property & { role: string })[]> {
  const res = await query<Property & { role: string }>(
    `SELECT p.id, p.name, p.city, p.currency, p.timezone, p.logo_url,
            p.tax_rate::float8 AS tax_rate, p.creator_email, s.role
     FROM properties p
     JOIN staff s ON s.property_id = p.id
     WHERE s.email = $1
       AND (p.creator_email IS NULL OR p.creator_email != $1)
     ORDER BY p.created_at DESC`,
    [email],
  )
  return res.rows
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function PortalPage() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")

  const email =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? ""

  const [owned, staffed] = await Promise.all([
    getOwnedProperties(email),
    getStaffProperties(email),
  ])

  const firstName = user.firstName ?? email.split("@")[0]
  const hasAny = owned.length > 0 || staffed.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Hotel className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-sans text-base font-semibold text-foreground">AuraStay</span>
              <span className="text-xs text-muted-foreground">Property Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{email}</span>
            </div>
            <Link
              href="/sign-out"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-sans text-2xl font-semibold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a property to manage or create a new one.
          </p>
        </div>

        {!hasAny ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-10">
            {/* Section A — Owned properties */}
            {owned.length > 0 && (
              <section>
                <SectionHeader
                  icon={Building2}
                  title="Your Properties"
                  subtitle="Hotels you created and own."
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {owned.map((p) => (
                    <PropertyCard key={p.id} property={p} badge="Owner" />
                  ))}
                  <NewPropertyCard />
                </div>
              </section>
            )}

            {/* Section B — Staff access */}
            {staffed.length > 0 && (
              <section>
                <SectionHeader
                  icon={Users}
                  title="Staff Access"
                  subtitle="Hotels where you have been added as a team member."
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {staffed.map((p) => (
                    <PropertyCard key={p.id} property={p} badge={p.role.replace("_", " ")} />
                  ))}
                </div>
              </section>
            )}

            {/* If they have staff access but no owned properties, still show create CTA */}
            {owned.length === 0 && (
              <section>
                <SectionHeader
                  icon={Building2}
                  title="Your Properties"
                  subtitle="Hotels you create and own will appear here."
                />
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <NewPropertyCard />
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon, title, subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="font-sans text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function PropertyCard({
  property, badge,
}: {
  property: Property & { role?: string }
  badge: string
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Hotel className="h-6 w-6 text-primary" />
        </div>
        <span className="mt-0.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
          {badge}
        </span>
      </div>

      <div className="mt-3">
        <p className="font-semibold text-foreground">{property.name}</p>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {property.city}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{property.currency}</p>
      </div>

      {/* Action */}
      <form
        action={async () => {
          "use server"
          await setActiveProperty(property.id)
        }}
        className="mt-4"
      >
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ExternalLink className="h-4 w-4" />
          Manage
        </button>
      </form>
    </div>
  )
}

function NewPropertyCard() {
  return (
    <Link
      href="/onboard"
      className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-background p-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
        <Plus className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-foreground">Add a new property</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Walk through the setup wizard</p>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card py-16 text-center">
      {/* Illustration placeholder */}
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
          <Building2 className="h-12 w-12 text-primary/60" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <Hotel className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>

      <div className="max-w-xs">
        <h2 className="font-sans text-xl font-semibold text-foreground">
          No properties yet
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Get started by creating your first hotel property. The setup wizard will
          guide you through inventory, pricing, and more in under 5 minutes.
        </p>
      </div>

      <Link
        href="/onboard"
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Create Your First Property
      </Link>
    </div>
  )
}
