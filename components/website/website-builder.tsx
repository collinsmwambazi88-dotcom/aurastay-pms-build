"use client"

import { useState, useTransition } from "react"
import { updateWebsiteConfig, updateRoomGroupImage, updatePropertySlug } from "@/lib/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, Upload, Image as ImageIcon } from "lucide-react"
import type { WebsiteConfig, RoomGroup } from "@/lib/types"

interface WebsiteBuilderProps {
  initialConfig: WebsiteConfig
  propertyId: number
  propertyName: string
  customSlug: string | null
  roomGroups: RoomGroup[]
}

export function WebsiteBuilder({
  initialConfig,
  propertyId,
  propertyName,
  customSlug,
  roomGroups,
}: WebsiteBuilderProps) {
  const [config, setConfig] = useState<WebsiteConfig>(initialConfig)
  const [slug, setSlug] = useState(customSlug || "")
  const [isPending, startTransition] = useTransition()
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)

  const handleSave = () => {
    startTransition(async () => {
      // Save config
      const result = await updateWebsiteConfig(propertyId, config)
      if (!result.ok) {
        toast.error(result.error ?? "Failed to save")
        return
      }

      // Save slug if changed
      if (slug && slug !== customSlug) {
        const slugResult = await updatePropertySlug(propertyId, slug)
        if (!slugResult.ok) {
          toast.error(slugResult.error ?? "Failed to save slug")
          return
        }
      }

      toast.success("Website configuration saved!")
    })
  }

  // Distinct upload handler for logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage("logo")
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error ?? "Logo upload failed")
        return
      }

      const data = await response.json()
      setConfig({ ...config, logoUrl: data.url })
      toast.success("Logo uploaded!")
    } catch (err) {
      console.error("[v0] Logo upload error:", err)
      toast.error("Logo upload failed")
    } finally {
      setUploadingImage(null)
      // Reset input
      e.target.value = ""
    }
  }

  // Distinct upload handler for hero banner
  const handleHeroBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage("hero")
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error ?? "Banner upload failed")
        return
      }

      const data = await response.json()
      setConfig({ ...config, heroImageUrl: data.url })
      toast.success("Hero banner uploaded!")
    } catch (err) {
      console.error("[v0] Hero banner upload error:", err)
      toast.error("Hero banner upload failed")
    } finally {
      setUploadingImage(null)
      // Reset input
      e.target.value = ""
    }
  }

  // Distinct upload handler for room group images
  const handleRoomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, roomGroupId: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(`room-${roomGroupId}`)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error ?? "Room image upload failed")
        return
      }

      const data = await response.json()
      const imageUrl = data.url

      // Update room group in database
      const updateResult = await updateRoomGroupImage(roomGroupId, imageUrl)
      if (!updateResult.ok) {
        toast.error(updateResult.error ?? "Failed to save room image")
        return
      }

      // Update local state for instant preview
      setConfig({
        ...config,
        roomImages: { ...config.roomImages, [roomGroupId]: imageUrl },
      })
      toast.success("Room image uploaded!")
    } catch (err) {
      console.error("[v0] Room image upload error:", err)
      toast.error("Room image upload failed")
    } finally {
      setUploadingImage(null)
      // Reset input
      e.target.value = ""
    }
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* LEFT: LIVE PREVIEW (60%) */}
      <div className="w-3/5 flex flex-col bg-gradient-to-br from-stone-100 to-stone-50 overflow-auto border-r border-border">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden border border-border">
            {/* Header with Logo */}
            {config.logoUrl && (
              <div className="px-8 py-4 bg-white border-b border-border flex items-center gap-4">
                <img src={config.logoUrl} alt="Logo" className="h-10 w-auto" />
                <span className="text-sm font-semibold text-muted-foreground">{propertyName}</span>
              </div>
            )}

            {/* Hero */}
            <div
              className="relative h-80 bg-cover bg-center flex flex-col justify-end p-8 text-white"
              style={{
                backgroundImage: config.heroImageUrl
                  ? `linear-gradient(135deg, ${config.primaryColor}99 0%, ${config.primaryColor}33 100%), url('${config.heroImageUrl}')`
                  : `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}dd 100%)`,
              }}
            >
              <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">{config.heroTitle || "Your Hotel"}</h1>
              <p className="text-lg drop-shadow-md">{config.heroSubtitle || "Welcome to our property"}</p>
              <Button className="w-fit mt-6 bg-white font-semibold hover:bg-stone-100" style={{ color: config.primaryColor }}>
                Check Availability
              </Button>
            </div>

            {/* Rooms Gallery */}
            {roomGroups.length > 0 && (
              <div className="px-8 py-8 bg-stone-50">
                <h2 style={{ color: config.primaryColor }} className="text-2xl font-bold mb-6">
                  Our Rooms
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {roomGroups.map((group) => (
                    <div key={group.id} className="bg-white rounded-lg overflow-hidden shadow border border-border">
                      {config.roomImages?.[group.id] || group.image_url ? (
                        <img
                          src={config.roomImages?.[group.id] || group.image_url || ""}
                          alt={group.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-stone-200 flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{group.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{group.description || "Beautiful room"}</p>
                        <p className="text-sm font-medium" style={{ color: config.primaryColor }}>
                          Starting from $150/night
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            <div className="px-8 py-8 bg-white">
              <h2 style={{ color: config.primaryColor }} className="text-2xl font-bold mb-4">
                About Us
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{config.aboutUsContent || "Tell your story..."}</p>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-stone-50 border-t border-border text-center text-sm text-muted-foreground">
              Powered by AuraStay
            </div>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="w-px bg-border" />

      {/* RIGHT: CONTROL PANEL (40%) */}
      <div className="w-2/5 bg-slate-900 text-slate-50 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Website Builder</h2>
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

        <Tabs defaultValue="hero" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="hero" className="text-slate-300 data-[state=active]:text-white text-xs">
              Hero
            </TabsTrigger>
            <TabsTrigger value="rooms" className="text-slate-300 data-[state=active]:text-white text-xs">
              Rooms
            </TabsTrigger>
            <TabsTrigger value="design" className="text-slate-300 data-[state=active]:text-white text-xs">
              Design
            </TabsTrigger>
            <TabsTrigger value="content" className="text-slate-300 data-[state=active]:text-white text-xs">
              Content
            </TabsTrigger>
          </TabsList>

          {/* HERO TAB */}
          <TabsContent value="hero" className="flex-1 overflow-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Logo</Label>
              <div className="flex gap-2">
                <Input
                  value={config.logoUrl || ""}
                  onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                  placeholder="Logo URL"
                  className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500 text-sm"
                />
                <label className="flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="cursor-pointer"
                    disabled={uploadingImage === "logo"}
                  >
                    {uploadingImage === "logo" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleLogoUpload}
                    disabled={uploadingImage === "logo"}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Hero Title</Label>
              <Input
                value={config.heroTitle}
                onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                placeholder="Hotel Name"
                className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Hero Subtitle</Label>
              <Input
                value={config.heroSubtitle}
                onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                placeholder="Tagline"
                className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Hero Banner</Label>
              <div className="flex gap-2">
                <Input
                  value={config.heroImageUrl || ""}
                  onChange={(e) => setConfig({ ...config, heroImageUrl: e.target.value })}
                  placeholder="Image URL"
                  className="bg-slate-800 border-slate-700 text-slate-50 placeholder:text-slate-500 text-sm"
                />
                <label className="flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="cursor-pointer"
                    disabled={uploadingImage === "hero"}
                  >
                    {uploadingImage === "hero" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleHeroBannerUpload}
                    disabled={uploadingImage === "hero"}
                  />
                </label>
              </div>
            </div>
          </TabsContent>

          {/* ROOMS TAB */}
          <TabsContent value="rooms" className="flex-1 overflow-auto px-6 py-4 space-y-6">
            {roomGroups.length === 0 ? (
              <p className="text-slate-400 text-sm">No room groups available. Create some in Settings.</p>
            ) : (
              roomGroups.map((group) => (
                <div key={group.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <h3 className="font-semibold text-white mb-3">{group.name}</h3>
                  <label className="w-full block">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="cursor-pointer w-full justify-start"
                      disabled={uploadingImage === `room-${group.id}`}
                    >
                      {uploadingImage === `room-${group.id}` ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => handleRoomImageUpload(e, group.id)}
                      disabled={uploadingImage === `room-${group.id}`}
                    />
                  </label>
                  {(config.roomImages?.[group.id] || group.image_url) && (
                    <p className="text-xs text-green-400 mt-2">✓ Image set</p>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* DESIGN TAB */}
          <TabsContent value="design" className="flex-1 overflow-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Primary Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="h-10 w-16 rounded cursor-pointer border border-slate-700"
                />
                <Input
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  placeholder="#4f46e5"
                  className="bg-slate-800 border-slate-700 text-slate-50 text-sm flex-1"
                />
              </div>
            </div>
          </TabsContent>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="flex-1 overflow-auto px-6 py-4 space-y-4 flex flex-col">
            <div className="space-y-2">
              <Label className="text-slate-300">Custom Slug</Label>
              <div className="flex gap-2">
                <span className="text-sm text-slate-400 pt-2.5">aura.stay.com/s/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="my-hotel"
                  className="bg-slate-800 border-slate-700 text-slate-50 text-sm flex-1"
                />
              </div>
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
              <Label className="text-slate-300">About Us</Label>
              <textarea
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
