import type { Metadata } from "next"
import { LandingNav } from "@/components/landing/landing-nav"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingFooter } from "@/components/landing/landing-footer"

export const metadata: Metadata = {
  title: "Innward — Built for 21st Century Hoteliers",
  description:
    "Ditch the legacy spreadsheets. Innward combines real-time operations, market intelligence, and direct booking in one seamless interface.",
}

export default function LandingPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "#020617", color: "#f8fafc" }}
    >
      <LandingNav />
      <LandingHero />
      <div id="features">
        <LandingFeatures />
      </div>
      <LandingFooter />
    </main>
  )
}
