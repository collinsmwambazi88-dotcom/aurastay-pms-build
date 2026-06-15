import { AppShell } from "@/components/shell/app-shell"
import { PropertySettingsForm } from "@/components/settings/property-settings-form"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import { getActiveProperty } from "@/lib/property"

export default async function SettingsPage() {
  const property = await getActiveProperty()

  return (
    <AppShell title="Settings">
      <div className="flex flex-col gap-6">
        <SettingsTabs active="general" />
        <PropertySettingsForm property={property} />
      </div>
    </AppShell>
  )
}
