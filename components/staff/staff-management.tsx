"use client"

import { useState, useTransition } from "react"
import { Plus, Loader2, UserPlus, Trash2, ShieldCheck, Mail } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  inviteStaff,
  removeStaff,
  updateStaffPermission,
  updateStaffRole,
} from "@/lib/actions"
import { cn } from "@/lib/utils"
import type { Staff, StaffRole } from "@/lib/types"

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  front_desk: "Front Desk",
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function StaffManagement({
  propertyId,
  staff,
}: {
  propertyId: number
  staff: Staff[]
}) {
  const [inviteOpen, setInviteOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-sans text-2xl font-semibold text-foreground">Staff &amp; Access</h2>
          <p className="text-sm text-muted-foreground">
            Manage who can access AuraStay and what they can see.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="h-4 w-4" />
          Invite Staff
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">View Revenue</TableHead>
              <TableHead className="text-center">Manage Rates</TableHead>
              <TableHead className="text-center">Manage Inventory</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <StaffRowItem key={member.id} member={member} />
            ))}
          </TableBody>
        </Table>
      </div>

      <InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} propertyId={propertyId} />
    </div>
  )
}

function StaffRowItem({ member }: { member: Staff }) {
  const [isPending, startTransition] = useTransition()

  function togglePermission(
    field: "can_view_revenue" | "can_manage_rates" | "can_manage_inventory",
    value: boolean,
  ) {
    startTransition(async () => {
      await updateStaffPermission(member.id, field, value)
    })
  }

  function handleRole(role: string | null) {
    if (!role) return
    startTransition(async () => {
      await updateStaffRole(member.id, role as StaffRole)
      toast.success(`${member.full_name} is now ${ROLE_LABELS[role as StaffRole]}`)
    })
  }

  function handleRemove() {
    startTransition(async () => {
      await removeStaff(member.id)
      toast.success(`Removed ${member.full_name}`)
    })
  }

  return (
    <TableRow className={cn(isPending && "opacity-60")}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {initials(member.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{member.full_name}</span>
              {member.status === "invited" && (
                <Badge variant="outline" className="gap-1 text-warning">
                  <Mail className="h-3 w-3" />
                  Invited
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{member.email}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Select value={member.role} onValueChange={handleRole}>
          <SelectTrigger className="w-36">
            <SelectValue>
              {(v: string) => (
                <span className="flex items-center gap-1.5">
                  {v === "admin" && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                  {ROLE_LABELS[v as StaffRole]}
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="front_desk">Front Desk</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={member.can_view_revenue}
          onCheckedChange={(v) => togglePermission("can_view_revenue", v)}
          aria-label="Can view revenue"
        />
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={member.can_manage_rates}
          onCheckedChange={(v) => togglePermission("can_manage_rates", v)}
          aria-label="Can manage rates"
        />
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={member.can_manage_inventory}
          onCheckedChange={(v) => togglePermission("can_manage_inventory", v)}
          aria-label="Can manage inventory"
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRemove}
          disabled={isPending}
          aria-label={`Remove ${member.full_name}`}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

function InviteStaffDialog({
  open,
  onOpenChange,
  propertyId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  propertyId: number
}) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<StaffRole>("front_desk")
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!fullName.trim() || !email.trim()) return
    startTransition(async () => {
      const res = await inviteStaff({ propertyId, fullName, email, role })
      if (res.ok) {
        toast.success(`Invitation sent to ${email.trim()}`)
        setFullName("")
        setEmail("")
        setRole("front_desk")
        onOpenChange(false)
      } else {
        toast.error(res.error ?? "Could not send invite")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Invite Staff Member
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jordan Lee"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Work email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@hotel.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Select value={role} onValueChange={(v) => setRole((v as StaffRole) ?? "front_desk")}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => ROLE_LABELS[v as StaffRole]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — full access</SelectItem>
                <SelectItem value="front_desk">Front Desk — limited access</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admins can see revenue and manage everything. Front desk permissions can be tuned per person.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !fullName.trim() || !email.trim()}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
