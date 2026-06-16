"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Printer, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * No-print toolbar shown on the clean folio print view.
 * Offers a manual print/save-PDF action and a way back to the folio.
 */
export function PrintToolbar({ reservationId, autoPrint = false }: { reservationId: number; autoPrint?: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [autoPrint])

  return (
    <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-3">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => router.push(`/reservations/${reservationId}`)}
      >
        <ArrowLeft className="h-4 w-4" /> Back to folio
      </Button>
      <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Print / Save PDF
      </Button>
    </div>
  )
}
