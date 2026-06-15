"use client"

import { useState, useTransition } from "react"
import { Plus, Loader2, DoorOpen, LayoutGrid } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createRoom, createRoomGroup } from "@/lib/actions"
import type { RoomGroup } from "@/lib/types"

export function InventoryActions({
  propertyId,
  roomGroups,
}: {
  propertyId: number
  roomGroups: RoomGroup[]
}) {
  const [roomOpen, setRoomOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" className="bg-transparent" onClick={() => setGroupOpen(true)}>
        <LayoutGrid className="h-4 w-4" />
        Add Room Group
      </Button>
      <Button onClick={() => setRoomOpen(true)} disabled={roomGroups.length === 0}>
        <Plus className="h-4 w-4" />
        Add Room
      </Button>

      <AddRoomDialog
        open={roomOpen}
        onOpenChange={setRoomOpen}
        roomGroups={roomGroups}
      />
      <AddRoomGroupDialog
        open={groupOpen}
        onOpenChange={setGroupOpen}
        propertyId={propertyId}
      />
    </div>
  )
}

function AddRoomDialog({
  open,
  onOpenChange,
  roomGroups,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  roomGroups: RoomGroup[]
}) {
  const [groupId, setGroupId] = useState<string>(roomGroups[0] ? String(roomGroups[0].id) : "")
  const [roomNumber, setRoomNumber] = useState("")
  const [floor, setFloor] = useState(1)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!groupId || !roomNumber.trim()) return
    startTransition(async () => {
      const res = await createRoom({
        roomGroupId: Number(groupId),
        roomNumber: roomNumber.trim(),
        floor,
      })
      if (res.ok) {
        toast.success(`Room ${roomNumber.trim()} added`)
        setRoomNumber("")
        onOpenChange(false)
      } else {
        toast.error(res.error ?? "Could not add room")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-primary" />
            Add Room
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Room group</Label>
            <Select value={groupId} onValueChange={(v) => setGroupId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a room group">
                  {(v: string) => roomGroups.find((g) => String(g.id) === v)?.name ?? "Select a room group"}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Room number</Label>
              <Input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 105"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Floor</Label>
              <Input
                type="number"
                min={0}
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !roomNumber.trim() || !groupId}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Room
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddRoomGroupDialog({
  open,
  onOpenChange,
  propertyId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  propertyId: number
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [baseCapacity, setBaseCapacity] = useState(2)
  const [maxCapacity, setMaxCapacity] = useState(4)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!name.trim()) return
    startTransition(async () => {
      const res = await createRoomGroup({
        propertyId,
        name: name.trim(),
        description,
        baseCapacity,
        maxCapacity: Math.max(baseCapacity, maxCapacity),
      })
      if (res.ok) {
        toast.success(`${name.trim()} category created`)
        setName("")
        setDescription("")
        onOpenChange(false)
      } else {
        toast.error(res.error ?? "Could not create category")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            Add Room Group
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Category name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Penthouse"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Top-floor suite with city views"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Base capacity</Label>
              <Input
                type="number"
                min={1}
                value={baseCapacity}
                onChange={(e) => setBaseCapacity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Max capacity</Label>
              <Input
                type="number"
                min={1}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
