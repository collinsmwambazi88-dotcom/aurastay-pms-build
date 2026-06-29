"use client"

import { useState } from "react"
import { X, ShieldCheck } from "lucide-react"

export function JudgeBanner({ propertyName }: { propertyName: string }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      className="relative flex items-center gap-4 rounded-xl px-5 py-4 pr-12"
      style={{
        background: "linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(124,58,237,0.15) 100%)",
        border: "1px solid rgba(139,92,246,0.4)",
        boxShadow: "0 0 24px rgba(99,102,241,0.15)",
      }}
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 0 12px rgba(99,102,241,0.5)" }}
      >
        <ShieldCheck className="h-5 w-5 text-white" />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "rgba(139,92,246,0.3)", color: "#c4b5fd" }}
          >
            AWS H0 Hackathon
          </span>
          <p className="font-semibold text-foreground text-sm">
            Welcome, Judge — Accessing {propertyName} as Superadmin
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          You have full access to all modules: Revenue KPIs, Market Intelligence, Rate Manager, Reservations, Housekeeping, and Guest data.
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-white/5"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
