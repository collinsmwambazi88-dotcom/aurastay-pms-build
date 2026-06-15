import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"
import { getActiveProperty } from "@/lib/property"
import { getFolio } from "@/lib/queries"
import { AppShell } from "@/components/shell/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDateRange, nightsBetween } from "@/lib/format"
import { reservationStatusMeta } from "@/lib/status"
import { cn } from "@/lib/utils"
import { FolioActions } from "@/components/folio/folio-actions"
import type { ReservationStatus } from "@/lib/types"

export default async function FolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const reservationId = Number(id)
  if (Number.isNaN(reservationId)) notFound()

  const property = await getActiveProperty()
  const folio = await getFolio(property.id, reservationId)
  if (!folio) notFound()

  const statusMeta =
    reservationStatusMeta[folio.reservation.status as ReservationStatus] ?? reservationStatusMeta.confirmed
  const currency = property.currency

  return (
    <AppShell title="Guest Folio">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            className="gap-1.5"
            render={
              <Link href="/reservations">
                <ArrowLeft className="h-4 w-4" /> Back to timeline
              </Link>
            }
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              className="gap-1.5 bg-transparent"
              render={
                <Link href={`/reservations/${reservationId}/print?auto=1`} target="_blank">
                  <Printer className="h-4 w-4" /> Print Folio
                </Link>
              }
            />
            <Badge variant="outline" className={cn("gap-1.5", statusMeta.bar)}>
              {statusMeta.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{folio.guest.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail label="Email" value={folio.guest.email ?? "—"} />
              <Detail label="Phone" value={folio.guest.phone ?? "—"} />
              <Detail
                label="ID"
                value={
                  folio.guest.id_number
                    ? `${folio.guest.id_type ?? "ID"} · ${folio.guest.id_number}`
                    : "—"
                }
              />
              <Detail label="Rate plan" value={folio.reservation.rate_plan ?? "Standard"} />
              <Detail
                label="Stay"
                value={formatDateRange(folio.reservation.check_in, folio.reservation.check_out)}
              />
              <Detail
                label="Nights"
                value={String(
                  nightsBetween(folio.reservation.check_in, folio.reservation.check_out),
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="text-3xl font-semibold text-foreground">
                  {formatCurrency(folio.invoice?.total ?? 0, currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {folio.invoice
                    ? folio.invoice.status === "paid"
                      ? "Paid in full"
                      : "Outstanding balance"
                    : "No invoice yet"}
                </p>
              </div>
              {folio.invoice && (
                <FolioActions
                  invoiceId={folio.invoice.id}
                  invoiceStatus={folio.invoice.status}
                  reservationId={folio.reservation.id}
                  reservationStatus={folio.reservation.status}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Guests</TableHead>
                  <TableHead className="text-right">Rate / night</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folio.stays.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.room_number}</TableCell>
                    <TableCell className="text-muted-foreground">{s.group_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateRange(s.check_in, s.check_out)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {s.guests_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(s.nightly_rate, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            {folio.lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No line items recorded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folio.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-medium text-foreground">{item.description}</span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">
                          {item.item_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(item.unit_price, currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(folio.invoice?.total ?? 0, currency)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
