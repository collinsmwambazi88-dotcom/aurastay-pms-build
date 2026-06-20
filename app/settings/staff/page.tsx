import { redirect } from "next/navigation"
import { AppShell } from "@/components/shell/app-shell"
import { StaffManagement } from "@/components/staff/staff-management"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { getActiveProperty } from "@/lib/property"
import { getStaff } from "@/lib/queries"
import { hasRole } from "@/lib/auth-utils"

export default async function StaffPage() {
  if (!(await hasRole("admin"))) {
    redirect("/unauthorized")
  }

  const property = await getActiveProperty()
  const staff = await getStaff(property.id)

  return (
    <AppShell title="Staff">
      <div className="flex flex-col gap-6">
        <SettingsTabs active="staff" />
        <StaffManagement propertyId={property.id} staff={staff} />
      </div>
    </AppShell>
  )
}
