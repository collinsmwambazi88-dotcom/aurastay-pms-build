"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { Loader2, Upload, Hotel, Save } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { updateProperty } from "@/lib/actions"
import type { Property } from "@/lib/types"

const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "AED", label: "AED — UAE Dirham" },
]

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Australia/Sydney",
]

export function PropertySettingsForm({ property }: { property: Property }) {
  const [name, setName] = useState(property.name)
  const [city, setCity] = useState(property.city)
  const [currency, setCurrency] = useState(property.currency)
  const [timezone, setTimezone] = useState(property.timezone)
  const [taxRate, setTaxRate] = useState(String(property.tax_rate ?? 0))
  const [logoUrl, setLogoUrl] = useState<string | null>(property.logo_url)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/upload-logo", { method: "POST", body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      setLogoUrl(data.url)
      toast.success("Logo uploaded — remember to save changes")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateProperty({
        propertyId: property.id,
        name,
        city,
        currency,
        timezone,
        taxRate: Number(taxRate) || 0,
        logoUrl,
      })
      if (res.ok) {
        toast.success("Property settings saved")
      } else {
        toast.error(res.error ?? "Could not save settings")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-sans text-2xl font-semibold text-foreground">Property Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update your hotel&apos;s identity, branding, and localization.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">General details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Hotel name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v ?? currency)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => v}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Timezone</Label>
                <Select value={timezone} onValueChange={(v) => setTimezone(v ?? timezone)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => v}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Tax rate (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Applied to room and add-on charges as a &quot;Tax&quot; line item on every new invoice.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hotel logo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
              {logoUrl ? (
                <Image
                  src={logoUrl || "/placeholder.svg"}
                  alt="Hotel logo preview"
                  width={160}
                  height={96}
                  className="max-h-28 w-auto object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Hotel className="h-7 w-7" />
                  <span className="text-xs">No logo uploaded</span>
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ""
              }}
            />
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {logoUrl ? "Replace logo" : "Upload logo"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">PNG, JPG, SVG or WebP — up to 4MB.</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending || uploading}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </div>
  )
}
