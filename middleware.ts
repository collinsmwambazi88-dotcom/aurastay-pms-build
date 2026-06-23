import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Routes that never require authentication
const isPublicRoute = createRouteMatcher([
  "/",                    // marketing landing page (always public)
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/rate/(.*)",           // guest rating pages are unauthenticated
  "/s/(.*)",              // public hotel storefront pages (no auth required)
  "/api/webhooks/(.*)",   // Clerk webhook must be reachable before auth
])

// Routes that require auth but do NOT require a selected property cookie
const isPropertyFreeRoute = createRouteMatcher([
  "/portal(.*)",
  "/onboard(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized(.*)",
  "/rate/(.*)",
  "/s/(.*)",              // public hotel storefront pages
  "/api/(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return

  // Enforce authentication on all non-public routes
  await auth.protect()

  // If authenticated but no property cookie set, send to the portal
  // (unless already on a property-free route)
  if (!isPropertyFreeRoute(req)) {
    const cookie = req.cookies.get("aura_property")
    if (!cookie?.value) {
      const portalUrl = new URL("/portal", req.url)
      return NextResponse.redirect(portalUrl)
    }
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
