import type { RatePlan } from "@/lib/types"

export const EXTRA_GUEST_SURCHARGE = 20

export interface PriceBreakdown {
  baseRate: number
  occupancySurcharge: number
  planAdjustment: number
  nightlyRate: number
  planLabel: string
}

/**
 * The pricing "brain": derive a nightly rate from a calendar base rate.
 * 1. Start from the base rate for the date.
 * 2. Add an occupancy surcharge for guests beyond the room's base capacity.
 * 3. Apply the rate plan adjustment (percentage or fixed) to the result.
 */
export function computeDerivedPrice(args: {
  baseRate: number
  baseCapacity: number
  guests: number
  plan?: Pick<RatePlan, "name" | "adjustment_type" | "adjustment_value"> | null
}): PriceBreakdown {
  const { baseRate, baseCapacity, guests, plan } = args

  const extraGuests = Math.max(0, guests - baseCapacity)
  const occupancySurcharge = extraGuests * EXTRA_GUEST_SURCHARGE
  const subtotal = baseRate + occupancySurcharge

  let planAdjustment = 0
  if (plan) {
    planAdjustment =
      plan.adjustment_type === "percentage"
        ? subtotal * (plan.adjustment_value / 100)
        : plan.adjustment_value
  }

  const nightlyRate = Math.max(0, Math.round((subtotal + planAdjustment) * 100) / 100)

  return {
    baseRate,
    occupancySurcharge,
    planAdjustment: Math.round(planAdjustment * 100) / 100,
    nightlyRate,
    planLabel: plan?.name ?? "No plan",
  }
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + "T00:00:00")
  const b = new Date(checkOut + "T00:00:00")
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000))
}
