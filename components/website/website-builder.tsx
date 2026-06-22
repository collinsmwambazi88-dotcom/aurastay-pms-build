"use client"

import { useState, useTransition } from "react"
import { updateWebsiteConfig } from "@/lib/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Loader2, Save, Upload } from "lucide-react"
import type { WebsiteConfig } from "@/lib/types"

interface WebsiteBuilderProps {
  initialConfig: WebsiteConfig
  propertyId: number
}

export function WebsiteBuilder({ initialConfig, propertyId }: WebsiteBuilderProps) {
  const [config, setConfig] = useState<WebsiteConfig>(initialConfig)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateWebsiteConfig(propertyId, config)
      if (result.ok) {
        toast.success("Website configuration saved!")
      } else {
        toast.error(result.error ?? "Failed to save")
      }
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    toast.info("Image upload not yet implemented — use a URL instead")
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* LEFT SIDE: LIVE PREVIEW (60%) */}
      <div className="w-3/5 flex flex-col bg-gradient-to-br from-stone-100 to-stone-50 overflow-auto border-r border-border">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden border border-border">
            {/* Hero Section */}
            <div
              className="relative h-96 bg-cover bg-center flex flex-col justify-end p-8 text-white"
              style={{
                backgroundImage: config.heroImageUrl
                  ? `linear-gradient(135deg, ${config.primaryColor}99 0%, ${config.primaryColor}33 100%), url('${config.heroImageUrl}')`
                  : `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}dd 100%)`,
              }}
            >
              <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">{config.heroTitle || "Your Hotel"}</h1>
              <p className="text-lg drop-shadow-md">{config.heroSubtitle || "Welcome"}</p>
              <div className="mt-6">
                <Button
                  onClick={() => toast.info("Mock booking dialog")}
                  className="bg-white text-base font-semibold hover:bg-stone-100"
                  style={{ color: config.primaryColor }}
                >
                  Book Now
                </Button>
              </div>
            </div>

            {/* About Section */}
            <div className="p-8 bg-white">
              <div className="prose prose-sm max-w-none">
                <h2 style={{ color: config.primaryColor }} className="text-2xl font-bold mb-4">
                  About Us
                </h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {config.aboutUsContent || "Tell your story..."}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-stone-50 border-t border-border text-center text-sm text-muted-foreground">
              Powered by AuraStay
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE: DIVIDER */}
      <div className="w-px bg-border" />

      {/* RIGHT SIDE: CONTROL PANEL (40%) */}
      <div className="w-2/5 bg-slate-900 text-slate-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            size="sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="hero" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="hero" className="text-slate-300 data-[state=active]:text-white">
              Hero
            </TabsTrigger>
            <TabsTrigger value="design" className="text-slate-300 data-[state=active]:text-white">
              Design
            </TabsTrigger>
            <TabsTrigger value="content" className="text-slate-300 data-[state=active]:text-white">
              Content
            </TabsTrigger>
          </TabsList>

          {/* HERO TAB */}
          <TabsContent value="hero" className="flex-1 overflow-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300">
                Hero Title
              </Label>
              <Input
                id="title"
                value={config.heroTitle}
                onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                placeholder="Your Hotel Name"
                className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle" className="text-slate-300">
                Hero Subtitle
              </Label>
              <Input
                id="subtitle"
                value={config.heroSubtitle}
                onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                placeholder="Your tagline"
                className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-slate-300">
                Hero Image URL
              </Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  value={config.heroImageUrl || ""}
                  onChange={(e) => setConfig({ ...config, heroImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500"
                />
              </div>
            </div>
          </TabsContent>

          {/* DESIGN TAB */}
          <TabsContent value="design" className="flex-1 overflow-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="color" className="text-slate-300">
                Primary Color
              </Label>
              <div className="flex gap-2 items-center">
                <input
                  id="color"
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="h-10 w-16 rounded cursor-pointer border border-slate-700"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  placeholder="#4f46e5"
                  className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500 flex-1"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300 mb-3">Color Preview</p>
              <div className="flex gap-2 flex-wrap">
                <div
                  className="h-10 w-24 rounded"
                  style={{ backgroundColor: config.primaryColor }}
                />
              </div>
            </div>
          </TabsContent>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="flex-1 overflow-auto px-6 py-4 space-y-4">
            <div className="space-y-2 h-full flex flex-col">
              <Label htmlFor="about" className="text-slate-300">
                About Us
              </Label>
              <textarea
                id="about"
                value={config.aboutUsContent}
                onChange={(e) => setConfig({ ...config, aboutUsContent: e.target.value })}
                placeholder="Tell your story..."
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-50 placeholder:text-slate-500 rounded px-3 py-2 text-sm resize-none"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
