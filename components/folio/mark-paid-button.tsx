"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { markInvoicePaid } from "@/lib/actions"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"

export function MarkPaidButton({ invoiceId }: { invoiceId: number }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      onClick={() =>
        startTransition(async () => {
          try {
            await markInvoicePaid(invoiceId)
            toast.success("Invoice marked as paid")
          } catch {
            toast.error("Could not update invoice")
          }
        })
      }
      disabled={isPending}
      className="w-full"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Mark as paid
    </Button>
  )
}
