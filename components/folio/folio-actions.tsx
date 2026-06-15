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
import { addFolioCharge, markInvoicePaid } from "@/lib/actions"
import { toast } from "sonner"
import { Loader2, Plus, CheckCircle2 } from "lucide-react"

export function FolioActions({
  invoiceId,
  invoiceStatus,
}: {
  invoiceId: number
  invoiceStatus: string
}) {
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [itemType, setItemType] = useState<"fee" | "addon" | "tax">("fee")
  const [isPending, startTransition] = useTransition()
  const [payPending, startPay] = useTransition()

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
        <Button onClick={handlePay} disabled={payPending} className="w-full">
          {payPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Settle invoice
        </Button>
      )}
    </div>
  )
}
