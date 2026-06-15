"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createBooking, quoteBooking, type BookingQuote } from "@/lib/actions"
import { formatCurrency } from "@/lib/format"
import { todayISO } from "@/lib/format"
import type { RoomGroup, RatePlan, Addon } from "@/lib/types"
import { toast } from "sonner"
import { Loader2, BedDouble, CheckCircle2, AlertCircle } from "lucide-react"

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

export function BookingDialog({
  isOpen,
  onClose,
  propertyId,
  roomGroups,
  ratePlans,
  addons,
  currency,
  prefill,
}: {
  isOpen: boolean
  onClose: () => void
  propertyId: number
  roomGroups: RoomGroup[]
  ratePlans: RatePlan[]
  addons: Addon[]
  currency: string
  prefill: { roomGroupId?: number; checkIn?: string }
}) {
  const today = todayISO()
  const [roomGroupId, setRoomGroupId] = useState<number | null>(null)
  const [ratePlanId, setRatePlanId] = useState<number | null>(null)
  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState(addDaysISO(today, 1))
  const [guests, setGuests] = useState(2)
  const [addonIds, setAddonIds] = useState<number[]>([])
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [idType, setIdType] = useState("Passport")
  const [idNumber, setIdNumber] = useState("")
  const [quote, setQuote] = useState<BookingQuote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Initialize / reset when opened
  useEffect(() => {
    if (!isOpen) return
    const initialGroup = prefill.roomGroupId ?? roomGroups[0]?.id ?? null
    const initialIn = prefill.checkIn ?? today
    setRoomGroupId(initialGroup)
    setRatePlanId(ratePlans[0]?.id ?? null)
    setCheckIn(initialIn)
    setCheckOut(addDaysISO(initialIn, 1))
    setGuests(2)
    setAddonIds([])
    setGuestName("")
    setGuestEmail("")
    setGuestPhone("")
    setIdType("Passport")
    setIdNumber("")
    setQuote(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const validRange = checkOut > checkIn

  // Live quote whenever inputs change
  useEffect(() => {
    if (!isOpen || !roomGroupId || !validRange) {
      setQuote(null)
      return
    }
    let cancelled = false
    setQuoting(true)
    const handle = setTimeout(async () => {
      try {
        const q = await quoteBooking({
          roomGroupId,
          ratePlanId,
          checkIn,
          checkOut,
          guests,
          addonIds,
        })
        if (!cancelled) setQuote(q)
      } catch {
        if (!cancelled) setQuote(null)
      } finally {
        if (!cancelled) setQuoting(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [isOpen, roomGroupId, ratePlanId, checkIn, checkOut, guests, addonIds, validRange])

  const selectedAddons = useMemo(
    () => addons.filter((a) => addonIds.includes(a.id)),
    [addons, addonIds],
  )

  const canSubmit =
    !!roomGroupId &&
    validRange &&
    guestName.trim().length > 1 &&
    (quote?.available ?? 0) > 0 &&
    !isPending

  function toggleAddon(id: number) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleSubmit() {
    if (!roomGroupId) return
    startTransition(async () => {
      try {
        const available = await import("@/lib/actions").then((m) =>
          m.getAvailableRooms(roomGroupId, checkIn, checkOut),
        )
        if (available.length === 0) {
          toast.error("No rooms available for those dates.")
          return
        }
        await createBooking({
          propertyId,
          roomGroupId,
          roomId: available[0].id,
          ratePlanId,
          checkIn,
          checkOut,
          guests,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim(),
          idType,
          idNumber: idNumber.trim(),
          addonIds,
        })
        toast.success(`Booking confirmed for ${guestName.trim()}`)
        onClose()
      } catch (err) {
        console.error(err)
        toast.error("Could not create booking. Please try again.")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="font-sans text-lg">New Booking</DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[calc(92vh-9rem)] grid-cols-1 overflow-y-auto md:grid-cols-[1.4fr_1fr]">
          {/* Form */}
          <div className="flex flex-col gap-5 p-6">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Check-in">
                <Input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => {
                    setCheckIn(e.target.value)
                    if (e.target.value >= checkOut) setCheckOut(addDaysISO(e.target.value, 1))
                  }}
                />
              </Field>
              <Field label="Check-out">
                <Input
                  type="date"
                  value={checkOut}
                  min={addDaysISO(checkIn, 1)}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Room type">
                <Select
                  value={roomGroupId ? String(roomGroupId) : ""}
                  onValueChange={(v) => setRoomGroupId(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select room type">
                      {(v: string) => roomGroups.find((g) => String(g.id) === v)?.name ?? "Select room type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roomGroups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Guests">
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                />
              </Field>
            </div>

            <Field label="Rate plan">
              <Select
                value={ratePlanId ? String(ratePlanId) : ""}
                onValueChange={(v) => setRatePlanId(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a rate plan">
                    {(v: string) => ratePlans.find((p) => String(p.id) === v)?.name ?? "Select a rate plan"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ratePlans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Separator />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-foreground">Guest details</p>
              <Field label="Full name">
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <Input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="jane@email.com"
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ID type">
                  <Select value={idType} onValueChange={(v) => setIdType(v ?? "Passport")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Driver's License">Driver&apos;s License</SelectItem>
                      <SelectItem value="National ID">National ID</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="ID number">
                  <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                </Field>
              </div>
            </div>

            {addons.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-foreground">Add-ons (per night)</p>
                  <div className="flex flex-col gap-2">
                    {addons.map((a) => {
                      const checked = addonIds.includes(a.id)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAddon(a.id)}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            checked
                              ? "border-primary/60 bg-primary/10"
                              : "border-border bg-card hover:bg-accent"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded border ${
                                checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                              }`}
                            >
                              {checked && <CheckCircle2 className="h-3 w-3" />}
                            </span>
                            {a.name}
                          </span>
                          <span className="text-muted-foreground">
                            {formatCurrency(Number(a.price), currency)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Summary */}
          <aside className="flex flex-col gap-4 border-t border-border bg-muted/40 p-6 md:border-t-0 md:border-l">
            <p className="text-sm font-medium text-foreground">Price summary</p>

            {!roomGroupId || !validRange ? (
              <p className="text-sm text-muted-foreground">Select dates and a room type to see pricing.</p>
            ) : quoting && !quote ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Calculating…
              </div>
            ) : quote ? (
              <div className="flex flex-col gap-3 text-sm">
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                    quote.available > 0
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {quote.available > 0 ? (
                    <>
                      <BedDouble className="h-4 w-4" />
                      {quote.available} room{quote.available > 1 ? "s" : ""} available
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      No availability for these dates
                    </>
                  )}
                </div>

                <Row label="Base rate / night" value={formatCurrency(quote.baseRate, currency)} />
                {quote.occupancySurcharge > 0 && (
                  <Row
                    label="Occupancy surcharge"
                    value={`+${formatCurrency(quote.occupancySurcharge, currency)}`}
                  />
                )}
                {quote.planAdjustment !== 0 && (
                  <Row
                    label={quote.planLabel}
                    value={`${quote.planAdjustment > 0 ? "+" : ""}${formatCurrency(quote.planAdjustment, currency)}`}
                  />
                )}
                <Separator />
                <Row
                  label={`Room x ${quote.nights} night${quote.nights > 1 ? "s" : ""}`}
                  value={formatCurrency(quote.roomTotal, currency)}
                />
                {selectedAddons.length > 0 && (
                  <Row label="Add-ons" value={formatCurrency(quote.addonsTotal, currency)} />
                )}
                <Separator />
                <div className="flex items-center justify-between text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatCurrency(quote.total, currency)}</span>
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
