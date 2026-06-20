"use client"

import { useState, useTransition } from "react"
import {
  Plus,
  Loader2,
  UserPlus,
  Trash2,
  ShieldCheck,
  Mail,
  SlidersHorizontal,
  CalendarRange,
  Receipt,
  DoorOpen,
  Sparkles,
  TrendingUp,
  Tag,
  Users,
  Brush,
  Wrench,
  BarChart2,
  Calculator,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  PERMISSION_CATALOG,
  PERMISSION_COUNT,
  countGranted,
  roleDefaults,
  type PermissionCategory,
} from "@/lib/permissions"
import { cn } from "@/lib/utils"
import type { Staff, StaffRole } from "@/lib/types"

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Admin",
  manager: "Manager",
  front_desk: "Front Desk",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  revenue_manager: "Revenue Manager",
  accounting: "Accounting",
}

const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  admin: "Full system access",
  manager: "All operations except staff & settings",
  front_desk: "Operations, check-ins, basic billing",
  housekeeping: "Room cleaning status only",
  maintenance: "Room status and out-of-order flags",
  revenue_manager: "Pricing, rate plans, market intel",
  accounting: "Billing, invoices, and revenue KPIs",
}

const ROLE_ICONS: Record<StaffRole, React.ComponentType<{ className?: string }>> = {
  admin: ShieldCheck,
  manager: Users,
  front_desk: DoorOpen,
  housekeeping: Brush,
  maintenance: Wrench,
  revenue_manager: BarChart2,
  accounting: Calculator,
}

const ROLE_ORDER: StaffRole[] = [
  "admin",
  "manager",
  "front_desk",
  "housekeeping",
  "maintenance",
  "revenue_manager",
  "accounting",
]

const CATEGORY_ICONS: Record<PermissionCategory["id"], React.ComponentType<{ className?: string }>> = {
  reservations: CalendarRange,
  billing: Receipt,
  stays: DoorOpen,
  housekeeping: Sparkles,
  revenue: TrendingUp,
  rates: Tag,
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
  const [managing, setManaging] = useState<Staff | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-sans text-2xl font-semibold text-foreground">Staff &amp; Access</h2>
          <p className="text-sm text-muted-foreground">
            Manage who can access AuraStay and exactly what they can do.
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
              <TableHead>Access</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <StaffRowItem key={member.id} member={member} onManage={() => setManaging(member)} />
            ))}
          </TableBody>
        </Table>
      </div>

      <InviteStaffDialog open={inviteOpen} onOpenChange={setInviteOpen} propertyId={propertyId} />
      <ManageAccessDialog
        member={managing}
        onOpenChange={(open) => {
          if (!open) setManaging(null)
        }}
      />
    </div>
  )
}

function StaffRowItem({ member, onManage }: { member: Staff; onManage: () => void }) {
  const [isPending, startTransition] = useTransition()
  const granted = countGranted(member.permissions)

  function handleRole(role: string | null) {
    if (!role) return
    startTransition(async () => {
      await updateStaffRole(member.id, role as StaffRole)
      toast.success(`${member.full_name} is now ${ROLE_LABELS[role as StaffRole]}`, {
        description: "Permissions reset to role defaults.",
      })
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
          <SelectTrigger className="w-40">
            <SelectValue>
              {(v: string) => {
                const Icon = ROLE_ICONS[v as StaffRole]
                return (
                  <span className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
                    {ROLE_LABELS[v as StaffRole]}
                  </span>
                )
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ROLE_ORDER.map((r) => {
              const Icon = ROLE_ICONS[r]
              return (
                <SelectItem key={r} value={r}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{ROLE_LABELS[r]}</span>
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        {granted === PERMISSION_COUNT ? (
          <Badge variant="outline" className="gap-1 text-success">
            <ShieldCheck className="h-3 w-3" />
            Full access
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{granted}</span> of {PERMISSION_COUNT} permissions
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent" onClick={onManage}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Manage access
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            disabled={isPending}
            aria-label={`Remove ${member.full_name}`}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function ManageAccessDialog({
  member,
  onOpenChange,
}: {
  member: Staff | null
  onOpenChange: (open: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  function toggle(key: string, value: boolean) {
    if (!member) return
    setPendingKey(key)
    startTransition(async () => {
      const res = await updateStaffPermission(member.id, key, value)
      setPendingKey(null)
      if (!res?.ok) toast.error(res?.error ?? "Could not update permission")
    })
  }

  function applyRoleDefaults() {
    if (!member) return
    const defaults = roleDefaults(member.role)
    startTransition(async () => {
      // Persist each permission to its role default.
      await Promise.all(
        Object.entries(defaults).map(([key, value]) => updateStaffPermission(member.id, key, value)),
      )
      toast.success(`Reset to ${ROLE_LABELS[member.role]} defaults`)
    })
  }

  const open = member !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {member && (
          <>
            <DialogHeader className="border-b border-border px-6 py-4">
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {initials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span>{member.full_name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {ROLE_LABELS[member.role]} · {member.email}
                  </span>
                </div>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Manage granular permissions for {member.full_name}
              </DialogDescription>
            </DialogHeader>

            <div className="flex max-h-[55vh] flex-col gap-5 overflow-y-auto px-6 py-5">
              {PERMISSION_CATALOG.map((category) => {
                const Icon = CATEGORY_ICONS[category.id]
                return (
                  <div key={category.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{category.label}</span>
                        <span className="text-xs text-muted-foreground">{category.description}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {category.permissions.map((perm) => {
                        const checked = Boolean(member.permissions[perm.key])
                        return (
                          <label
                            key={perm.key}
                            htmlFor={perm.key}
                            className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-secondary/40"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{perm.label}</span>
                              <span className="text-xs text-muted-foreground">{perm.description}</span>
                            </div>
                            <Switch
                              id={perm.key}
                              checked={checked}
                              disabled={isPending && pendingKey === perm.key}
                              onCheckedChange={(v) => toggle(perm.key, v)}
                              aria-label={`${category.label}: ${perm.label}`}
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <DialogFooter className="items-center border-t border-border px-6 py-4 sm:justify-between">
              <Button
                variant="ghost"
                className="gap-1.5"
                onClick={applyRoleDefaults}
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset to {ROLE_LABELS[member.role as StaffRole]} defaults
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
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
        toast.success(`Invitation email sent to ${email.trim()}`, {
          description: `${fullName} will receive an email to set up their account as ${ROLE_LABELS[role]}.`,
        })
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
                <SelectValue>
                  {(v: string) => {
                    const Icon = ROLE_ICONS[v as StaffRole]
                    return (
                      <span className="flex items-center gap-1.5">
                        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
                        {ROLE_LABELS[v as StaffRole]}
                      </span>
                    )
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROLE_ORDER.map((r) => {
                  const Icon = ROLE_ICONS[r]
                  return (
                    <SelectItem key={r} value={r}>
                      <div className="flex flex-col py-0.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {ROLE_LABELS[r]}
                        </span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A starter permission set is applied automatically. Fine-tune it anytime via Manage access.
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
