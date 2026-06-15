import { notFound } from "next/navigation"
import Image from "next/image"
import { getActiveProperty } from "@/lib/property"
import { getFolio } from "@/lib/queries"
import { PrintToolbar } from "@/components/folio/print-toolbar"
import { formatCurrencyPrecise, formatDate, formatDateRange, nightsBetween } from "@/lib/format"

export default async function FolioPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ auto?: string }>
}) {
  const { id } = await params
  const { auto } = await searchParams
  const reservationId = Number(id)
  if (Number.isNaN(reservationId)) notFound()

  const property = await getActiveProperty()
  const folio = await getFolio(property.id, reservationId)
  if (!folio) notFound()

  const currency = property.currency
  const total = folio.invoice?.total ?? 0
  const subtotal = folio.lineItems
    .filter((i) => i.item_type !== "tax")
    .reduce((sum, i) => sum + i.amount, 0)
  const taxTotal = folio.lineItems
    .filter((i) => i.item_type === "tax")
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="min-h-screen bg-muted/30">
      <PrintToolbar reservationId={reservationId} autoPrint={auto === "1"} />

      <div className="print-sheet mx-auto my-8 w-full max-w-3xl bg-card p-10 shadow-sm">
        {/* Header */}
        <header className="flex items-start justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            {property.logo_url ? (
              <Image
                src={property.logo_url || "/placeholder.svg"}
                alt={`${property.name} logo`}
                width={48}
                height={48}
                className="h-12 w-auto object-contain"
                unoptimized
              />
            ) : null}
            <div>
              <h1 className="font-sans text-xl font-semibold text-foreground">{property.name}</h1>
              <p className="text-sm text-muted-foreground">{property.city}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">INVOICE</p>
            <p className="text-sm text-muted-foreground">
              #{folio.invoice?.id ?? folio.reservation.id}
            </p>
            <p className="text-xs text-muted-foreground">Issued {formatDate(new Date().toISOString())}</p>
          </div>
        </header>

        {/* Bill to + stay */}
        <section className="grid grid-cols-2 gap-6 py-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bill to</p>
            <p className="font-medium text-foreground">{folio.guest.full_name}</p>
            {folio.guest.email ? <p className="text-sm text-muted-foreground">{folio.guest.email}</p> : null}
            {folio.guest.phone ? <p className="text-sm text-muted-foreground">{folio.guest.phone}</p> : null}
            {folio.guest.id_number ? (
              <p className="text-sm text-muted-foreground">
                {folio.guest.id_type ?? "ID"}: {folio.guest.id_number}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Stay</p>
            <p className="text-sm text-foreground">
              {formatDateRange(folio.reservation.check_in, folio.reservation.check_out)}
            </p>
            <p className="text-sm text-muted-foreground">
              {nightsBetween(folio.reservation.check_in, folio.reservation.check_out)} night(s) ·{" "}
              {folio.reservation.rate_plan ?? "Standard"}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              Status: {folio.reservation.status.replace("_", " ")}
            </p>
          </div>
        </section>

        {/* Rooms */}
        {folio.stays.length > 0 && (
          <section className="pb-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Rooms</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Room</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium">Dates</th>
                  <th className="py-2 text-right font-medium">Rate / night</th>
                </tr>
              </thead>
              <tbody>
                {folio.stays.map((s) => (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="py-2 font-medium text-foreground">{s.room_number}</td>
                    <td className="py-2 text-muted-foreground">{s.group_name}</td>
                    <td className="py-2 text-muted-foreground">
                      {formatDateRange(s.check_in, s.check_out)}
                    </td>
                    <td className="py-2 text-right text-foreground">
                      {formatCurrencyPrecise(s.nightly_rate, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Charges */}
        <section className="py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Charges</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Unit</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {folio.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-2 text-foreground">{item.description}</td>
                  <td className="py-2 text-right text-muted-foreground">{item.quantity}</td>
                  <td className="py-2 text-right text-muted-foreground">
                    {formatCurrencyPrecise(item.unit_price, currency)}
                  </td>
                  <td className="py-2 text-right text-foreground">
                    {formatCurrencyPrecise(item.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals */}
        <section className="ml-auto flex w-full max-w-xs flex-col gap-1.5 pt-2">
          <Row label="Subtotal" value={formatCurrencyPrecise(subtotal, currency)} />
          {taxTotal > 0 && <Row label="Tax" value={formatCurrencyPrecise(taxTotal, currency)} />}
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
            <span>Total {folio.invoice?.status === "paid" ? "(Paid)" : "Due"}</span>
            <span>{formatCurrencyPrecise(total, currency)}</span>
          </div>
        </section>

        <footer className="mt-10 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Thank you for staying with {property.name}. This document was generated by AuraStay PMS.
        </footer>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
