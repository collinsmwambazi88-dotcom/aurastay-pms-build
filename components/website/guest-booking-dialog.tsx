"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import type { Property, WebsiteConfig, RoomGroup } from "@/lib/types"
import { toast } from "sonner"
import { createPublicBooking } from "@/lib/actions"

// Initialise Stripe.js once — uses platform publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface GuestBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property
  roomGroup: RoomGroup
  config: WebsiteConfig
}

type DialogStep = "dates" | "details" | "payment" | "stripe" | "success"

// ─── Inner form rendered inside <Elements> ───────────────────────────────────
function StripePaymentForm({
  reservationId,
  onSuccess,
  onBack,
  config,
}: {
  reservationId: number
  onSuccess: () => void
  onBack: () => void
  config: WebsiteConfig
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isConfirming, setIsConfirming] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!stripe || !elements) return
    setIsConfirming(true)
    setStripeError(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL is required by Stripe but we handle success in-dialog
        return_url: window.location.href,
      },
      redirect: "if_required",
    })

    if (error) {
      setStripeError(error.message ?? "Payment failed. Please try again.")
      setIsConfirming(false)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="space-y-5 py-4">
      <PaymentElement />

      {stripeError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {stripeError}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} disabled={isConfirming} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirming || !stripe || !elements}
          className="flex-1 text-white"
          style={{ backgroundColor: config?.primaryColor }}
        >
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Confirm Payment"
          )}
        </Button>
      </div>
    </div>
  )
}

// ─── Main dialog ─────────────────────────────────────────────────────────────
export function GuestBookingDialog({
  open,
  onOpenChange,
  property,
  roomGroup,
  config,
}: GuestBookingDialogProps) {
  const { user } = useUser()
  const [step, setStep] = useState<DialogStep>("dates")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [reservationId, setReservationId] = useState<number | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  // Pre-fill from Clerk when dialog opens
  useEffect(() => {
    if (open && user) {
      setFullName(user.fullName || "")
      setEmail(user.primaryEmailAddress?.emailAddress || "")
      setStep("dates")
    }
  }, [open, user])

  const nights =
    checkIn && checkOut
      ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      : 0
  const pricePerNight = 150
  const subtotal = nights * pricePerNight
  const taxRate = property.tax_rate ?? 12.5
  const tax = Math.round(subtotal * taxRate) / 100
  const total = subtotal + tax

  const handleDatesNext = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select both check-in and check-out dates")
      return
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.error("Check-out must be after check-in")
      return
    }
    setStep("details")
  }

  const handleDetailsNext = () => {
    if (!fullName || !email || !phone) {
      toast.error("Please fill in all guest details")
      return
    }
    setStep("payment")
  }

  const handleConfirmBooking = async () => {
    setIsProcessing(true)
    try {
      const result = await createPublicBooking({
        propertyId: property.id,
        roomGroupId: roomGroup.id,
        guestName: fullName,
        guestEmail: email,
        guestPhone: phone,
        checkIn,
        checkOut,
        payNow: false,
      })
      if (!result.ok) {
        toast.error(result.error ?? "Failed to create booking")
        return
      }
      setReservationId(result.reservationId ?? null)
      setStep("success")
    } catch {
      toast.error("Failed to create booking")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayNow = async () => {
    setIsProcessing(true)
    try {
      const result = await createPublicBooking({
        propertyId: property.id,
        roomGroupId: roomGroup.id,
        guestName: fullName,
        guestEmail: email,
        guestPhone: phone,
        checkIn,
        checkOut,
        payNow: true,
      })
      if (!result.ok) {
        toast.error(result.error ?? "Failed to create booking")
        return
      }
      if (!result.clientSecret) {
        toast.error("Could not initialise payment. Please try again.")
        return
      }
      setReservationId(result.reservationId ?? null)
      setClientSecret(result.clientSecret)
      setStep("stripe")
    } catch {
      toast.error("Failed to create booking")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep("dates")
      setCheckIn("")
      setCheckOut("")
      setFullName(user?.fullName || "")
      setEmail(user?.primaryEmailAddress?.emailAddress || "")
      setPhone("")
      setReservationId(null)
      setClientSecret(null)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">

        {/* ── Success ── */}
        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle>Booking Confirmed</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Your booking is confirmed!</h3>
              <p className="text-muted-foreground mb-2">
                Reservation ID:{" "}
                <span className="font-mono font-semibold">{reservationId}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                A confirmation will be sent to {email}
              </p>
              <Button
                onClick={handleClose}
                className="text-white"
                style={{ backgroundColor: config?.primaryColor }}
              >
                Close
              </Button>
            </div>
          </>
        )}

        {/* ── Stripe payment form ── */}
        {step === "stripe" && clientSecret && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Payment Details</DialogTitle>
            </DialogHeader>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <StripePaymentForm
                reservationId={reservationId!}
                onSuccess={() => setStep("success")}
                onBack={() => setStep("payment")}
                config={config}
              />
            </Elements>
          </>
        )}

        {/* ── Dates ── */}
        {step === "dates" && (
          <>
            <DialogHeader>
              <DialogTitle>Select Your Dates</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="checkin">Check-in</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout">Check-out</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                />
              </div>

              {nights > 0 && (
                <div className="bg-stone-50 p-4 rounded-lg border">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{roomGroup.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {nights} {nights === 1 ? "night" : "nights"} × ${pricePerNight}
                  </p>
                  <div className="space-y-1 border-t pt-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({taxRate}%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-1 border-t">
                      <span>Total</span>
                      <span style={{ color: config?.primaryColor }}>
                        {property.currency.toUpperCase()} {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleDatesNext}
                  disabled={!checkIn || !checkOut}
                  className="flex-1 text-white"
                  style={{ backgroundColor: config?.primaryColor }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Details ── */}
        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>Your Information</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-stone-50 p-4 rounded-lg border text-sm">
                <p className="font-medium">{roomGroup.name}</p>
                <p className="text-muted-foreground">
                  {checkIn} → {checkOut} ({nights} nights)
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep("dates")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleDetailsNext}
                  disabled={!fullName || !email || !phone}
                  className="flex-1 text-white"
                  style={{ backgroundColor: config?.primaryColor }}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Payment choice ── */}
        {step === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Your Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="bg-stone-50 p-4 rounded-lg border">
                <p className="font-medium mb-1">{roomGroup.name}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  {checkIn} → {checkOut} ({nights} nights)
                </p>
                <div className="space-y-1 border-t pt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({taxRate}%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-1 border-t">
                    <span>Total</span>
                    <span style={{ color: config?.primaryColor }}>
                      {property.currency.toUpperCase()} {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guest summary */}
              <div className="bg-slate-50 p-3 rounded border text-sm">
                <p className="font-medium">{fullName}</p>
                <p className="text-muted-foreground">{email}</p>
                <p className="text-muted-foreground">{phone}</p>
              </div>

              {!property.stripe_onboarding_complete && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Online payments are not yet enabled. You can confirm your booking
                    and arrange payment at the hotel.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("details")}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleConfirmBooking}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm Booking"
                  )}
                </Button>
                <Button
                  onClick={handlePayNow}
                  disabled={isProcessing || !property.stripe_onboarding_complete}
                  className="flex-1 text-white"
                  style={{ backgroundColor: config?.primaryColor }}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Pay Now"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
