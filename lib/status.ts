import type { ReservationStatus, RoomStatus, InvoiceStatus } from "@/lib/types"

export const reservationStatusMeta: Record<
  ReservationStatus,
  { label: string; bar: string; text: string; dot: string }
> = {
  confirmed: {
    label: "Confirmed",
    bar: "bg-info/15 border-info/40 text-info-foreground",
    text: "text-info",
    dot: "bg-info",
  },
  checked_in: {
    label: "Checked in",
    bar: "bg-success/15 border-success/40 text-success-foreground",
    text: "text-success",
    dot: "bg-success",
  },
  checked_out: {
    label: "Checked out",
    bar: "bg-muted border-border text-muted-foreground",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    bar: "bg-destructive/10 border-destructive/30 text-destructive",
    text: "text-destructive",
    dot: "bg-destructive",
  },
}

export const roomStatusMeta: Record<RoomStatus, { label: string; className: string; dot: string }> = {
  clean: { label: "Clean & Ready", className: "text-success", dot: "bg-success" },
  occupied: { label: "Occupied", className: "text-primary", dot: "bg-primary" },
  dirty: { label: "Needs Cleaning", className: "text-warning", dot: "bg-warning" },
  out_of_order: { label: "Out of Order", className: "text-destructive", dot: "bg-destructive" },
}

export const invoiceStatusMeta: Record<InvoiceStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-success/15 text-success border-success/30" },
  pending: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30" },
  overdue: { label: "Overdue", className: "bg-destructive/15 text-destructive border-destructive/30" },
}
