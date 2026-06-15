"use client"

import { useState, useTransition } from "react"
import { Plus, Loader2, Pencil, Trash2, Coffee } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createAddon, updateAddon, deleteAddon } from "@/lib/actions"
import { formatCurrencyPrecise } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Addon } from "@/lib/types"

export function AddonManager({
  propertyId,
  addons,
  currency,
}: {
  propertyId: number
  addons: Addon[]
  currency: string
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Addon | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(addon: Addon) {
    setEditing(addon)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          The master list of sellable extras. Prices here apply to new bookings.
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Add-on
        </Button>
      </div>

      {addons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Coffee className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">No add-ons yet</p>
            <p className="text-sm text-muted-foreground">
              Create extras like a Breakfast Buffet or Airport Transfer to upsell at booking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Add-on</TableHead>
                <TableHead className="text-right">Price (per night)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.map((addon) => (
                <AddonRow
                  key={addon.id}
                  addon={addon}
                  currency={currency}
                  onEdit={() => openEdit(addon)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddonDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        propertyId={propertyId}
        addon={editing}
      />
    </div>
  )
}

function AddonRow({
  addon,
  currency,
  onEdit,
}: {
  addon: Addon
  currency: string
  onEdit: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteAddon(addon.id)
      toast.success(`Removed ${addon.name}`)
    })
  }

  return (
    <TableRow className={cn(isPending && "opacity-60")}>
      <TableCell className="font-medium text-foreground">{addon.name}</TableCell>
      <TableCell className="text-right tabular-nums text-foreground">
        {formatCurrencyPrecise(addon.price, currency)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${addon.name}`}>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={`Delete ${addon.name}`}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function AddonDialog({
  open,
  onOpenChange,
  propertyId,
  addon,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  propertyId: number
  addon: Addon | null
}) {
  const isEdit = addon !== null
  const [name, setName] = useState(addon?.name ?? "")
  const [price, setPrice] = useState(addon?.price ?? 0)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      const res = isEdit
        ? await updateAddon({ id: addon!.id, name, price })
        : await createAddon({ propertyId, name, price })
      if (res.ok) {
        toast.success(isEdit ? `${name.trim()} updated` : `${name.trim()} added`)
        onOpenChange(false)
      } else {
        toast.error(res.error ?? "Could not save add-on")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-primary" />
            {isEdit ? "Edit Add-on" : "Add Add-on"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Breakfast Buffet"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Price (per night)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Add-on"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
