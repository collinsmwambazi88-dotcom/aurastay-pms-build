"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, AlertCircle } from "lucide-react"
import type { Property, RoomGroup } from "@/lib/types"
import { toast } from "sonner"

interface GuestBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property
  roomGroup: RoomGroup
  checkIn: string
  checkOut: string
}

export function GuestBookingDialog({
  open,
  onOpenChange,
  property,
  roomGroup,
  checkIn,
  checkOut,
}: GuestBookingDialogProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 1
  const totalPrice = nights * 150 // Mock price per night

  const handleBook = async () => {
    if (!fullName || !email || !phone) {
      toast.error("Please fill in all fields")
      return
    }

    setIsProcessing(true)
    try {
      // Mock booking flow - in production this would:
      // 1. Create a reservation
      // 2. Create an invoice
      // 3. Call createPaymentIntent
      // 4. Open Stripe Elements modal
      toast.success(`Booking confirmed for ${fullName}! Stripe payment flow coming soon.`)
      onOpenChange(false)
    } catch (err) {
      toast.error("Booking failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Booking Summary */}
          <div className="bg-stone-50 p-4 rounded-lg border border-border">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{roomGroup.name}</span>
              <span className="font-semibold">${totalPrice}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {checkIn} to {checkOut} ({nights} nights)
            </div>
          </div>

          {/* Guest Info */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-sm">
                Full Name
              </Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
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
              <Label htmlFor="phone" className="text-sm">
                Phone
              </Label>
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

          {!property.stripe_onboarding_complete && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Card payments are not yet available. Please contact the hotel to complete your booking.
              </p>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${totalPrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${Math.round(totalPrice * property.tax_rate / 100 * 100) / 100}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total</span>
              <span style={{ color: property.website_config?.primaryColor }} className="text-lg">
                {property.currency.toUpperCase()} {(totalPrice + Math.round(totalPrice * property.tax_rate / 100 * 100) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              disabled={isProcessing || !property.stripe_onboarding_complete}
              className="flex-1 text-white"
              style={{ backgroundColor: property.website_config?.primaryColor }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay Now"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
