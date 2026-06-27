"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { seedMarketData } from "@/lib/actions"
import { toast } from "sonner"

interface ManualScrapeButtonProps {
  city: string
  propertyId: number
}

export function ManualScrapeButton({ city, propertyId }: ManualScrapeButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleScrape = () => {
    startTransition(async () => {
      const result = await seedMarketData(city, propertyId)
      if (!result.ok) {
        toast.error(`Scrape failed: ${result.error ?? "Unknown error"}`)
        return
      }
      toast.success(`Loaded ${result.rowsInserted} price records for ${city}`)
      router.refresh()
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleScrape}
      disabled={isPending}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Loading data…" : "Load Past Prices"}
    </Button>
  )
}
