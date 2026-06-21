"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { addFolioCharge, markInvoicePaid, cancelReservation, createPaymentIntent } from "@/lib/actions"
import { toast } from "sonner"
import { Loader2, Plus, CheckCircle2, Ban, CreditCard } from "lucide-react"

export function FolioActions({
  invoiceId,
  invoiceStatus,
  reservationId,
  reservationStatus,
  stripeReady,
}: {
  invoiceId: number
  invoiceStatus: string
  reservationId: number
  reservationStatus: string
  stripeReady: boolean
}) {
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [itemType, setItemType] = useState<"fee" | "addon" | "tax">("fee")
  const [isPending, startTransition] = useTransition()
  const [payPending, startPay] = useTransition()
  const [cardPending, startCardPay] = useTransition()
  const [cancelPending, startCancel] = useTransition()
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const canCancel = reservationStatus === "confirmed" || reservationStatus === "checked_in"

  function handleCancel() {
    startCancel(async () => {
      try {
        await cancelReservation(reservationId)
        toast.success(`Reservation #${reservationId} cancelled`)
        setConfirmingCancel(false)
      } catch {
        toast.error("Could not cancel the reservation.")
      }
    })
  }

  function handleAdd() {
    if (description.trim().length < 2 || unitPrice <= 0) {
      toast.error("Enter a description and a price greater than zero.")
      return
    }
    startTransition(async () => {
      try {
        await addFolioCharge({
          invoiceId,
          description: description.trim(),
          quantity,
          unitPrice,
          itemType,
        })
        toast.success("Charge added to folio")
        setDescription("")
        setQuantity(1)
        setUnitPrice(0)
      } catch {
        toast.error("Could not add the charge.")
      }
    })
  }

  function handlePay() {
    startPay(async () => {
      try {
        await markInvoicePaid(invoiceId)
        toast.success("Invoice settled")
      } catch {
        toast.error("Could not settle the invoice.")
      }
    })
  }

  function handleCardPay() {
    startCardPay(async () => {
      const result = await createPaymentIntent(invoiceId)
      if (!result.ok || !result.clientSecret) {
        toast.error(result.error ?? "Could not create payment. Please try again.")
        return
      }
      // Open Stripe's hosted payment page via the client secret redirect
      // In a full integration this would open a Stripe Elements modal; for now
      // we surface the client secret in a toast so the front-end can be wired up.
      toast.success("Payment intent created — wire Stripe Elements here.")
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">Add charge</p>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Minibar, late checkout…"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Qty</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Unit price</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={itemType} onValueChange={(v) => setItemType(v as typeof itemType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fee">Fee</SelectItem>
                <SelectItem value="addon">Add-on</SelectItem>
                <SelectItem value="tax">Tax</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleAdd} disabled={isPending} variant="outline" className="bg-transparent">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add to folio
        </Button>
      </div>

      {invoiceStatus !== "paid" && (
        <div className="flex flex-col gap-2">
          <Button onClick={handlePay} disabled={payPending} className="w-full">
            {payPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Settle invoice
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-full">
                <span className="w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCardPay}
                    disabled={!stripeReady || cardPending}
                    className="w-full bg-transparent"
                  >
                    {cardPending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <CreditCard className="h-4 w-4" />}
                    Pay with Card
                  </Button>
                </span>
              </TooltipTrigger>
              {!stripeReady && (
                <TooltipContent side="bottom">
                  Stripe not connected in Settings
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {canCancel &&
        (confirmingCancel ? (
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-foreground">Cancel this reservation?</p>
            <p className="text-xs text-muted-foreground">
              The room will be released and the stay voided. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => setConfirmingCancel(false)}
                disabled={cancelPending}
              >
                Keep booking
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={handleCancel}
                disabled={cancelPending}
              >
                {cancelPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Cancel booking
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmingCancel(true)}
          >
            <Ban className="h-4 w-4" />
            Cancel booking
          </Button>
        ))}
    </div>
  )
}
