"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2,
  BedDouble,
  DollarSign,
  Rocket,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Hotel,
} from "lucide-react"
import { onboardNewProperty, setActiveProperty } from "@/lib/actions"
import type { RoomCategoryInput } from "@/lib/actions"

// ─── Constants ───────────────────────────────────────────────────────────────

const CURRENCIES = ["USD", "EUR", "GBP", "KES", "ZAR", "AED", "CAD", "AUD", "SGD", "INR"]
const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Africa/Nairobi",
  "Africa/Johannesburg", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "Australia/Sydney", "Pacific/Auckland",
]

const STEPS = [
  { id: 1, label: "Identity",   icon: Building2   },
  { id: 2, label: "Inventory",  icon: BedDouble   },
  { id: 3, label: "Pricing",    icon: DollarSign  },
  { id: 4, label: "Review",     icon: Rocket      },
]

// ─── Slide animation variants ─────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center:                  ({ x: 0, opacity: 1 }),
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

const transition = { type: "spring" as const, stiffness: 320, damping: 30 }

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardProps {
  creatorEmail: string
  creatorName: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingWizard({ creatorEmail, creatorName }: WizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep]       = useState(1)
  const [direction, setDir]   = useState(1)
  const [error, setError]     = useState<string | null>(null)

  // Step 1 fields
  const [name,     setName]     = useState("")
  const [city,     setCity]     = useState("")
  const [currency, setCurrency] = useState("USD")
  const [timezone, setTimezone] = useState("America/New_York")

  // Step 2 fields — room categories
  const [categories, setCategories] = useState<RoomCategoryInput[]>([
    { name: "Deluxe King", roomCount: 10, baseRate: 0 },
  ])

  function addCategory() {
    setCategories((prev) => [...prev, { name: "", roomCount: 5, baseRate: 0 }])
  }
  function removeCategory(i: number) {
    setCategories((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateCategory(i: number, field: keyof RoomCategoryInput, value: string | number) {
    setCategories((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    )
  }

  function go(next: number) {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  // Validation per step
  function canAdvance(): boolean {
    if (step === 1) return name.trim().length > 0 && city.trim().length > 0
    if (step === 2) return categories.every((c) => c.name.trim().length > 0 && c.roomCount > 0)
    if (step === 3) return categories.every((c) => c.baseRate > 0)
    return true
  }

  async function handleLaunch() {
    setError(null)
    startTransition(async () => {
      const res = await onboardNewProperty({
        name, city, currency, timezone,
        creatorEmail,
        categories,
      })
      if (!res.ok || !res.propertyId) {
        setError(res.error ?? "Something went wrong. Please try again.")
        return
      }
      // Set as active property and navigate to Operations
      await setActiveProperty(res.propertyId)
    })
  }

  const totalRooms = categories.reduce((s, c) => s + Number(c.roomCount), 0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Hotel className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-sans text-base font-semibold text-foreground">AuraStay</span>
        </div>
        <span className="text-sm text-muted-foreground">
          Welcome, {creatorName}
        </span>
      </header>

      {/* Progress bar */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {STEPS.map((s, idx) => {
            const Icon = s.icon
            const done    = step > s.id
            const active  = step === s.id
            return (
              <div key={s.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                      done   ? "border-primary bg-primary text-primary-foreground"
                             : active ? "border-primary bg-background text-primary"
                             : "border-muted bg-background text-muted-foreground",
                    ].join(" ")}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={[
                    "text-xs font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  ].join(" ")}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={[
                    "mx-2 mb-5 h-0.5 flex-1 transition-all duration-500",
                    step > s.id ? "bg-primary" : "bg-muted",
                  ].join(" ")} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              {step === 1 && (
                <StepIdentity
                  name={name} setName={setName}
                  city={city} setCity={setCity}
                  currency={currency} setCurrency={setCurrency}
                  timezone={timezone} setTimezone={setTimezone}
                />
              )}
              {step === 2 && (
                <StepInventory
                  categories={categories}
                  onAdd={addCategory}
                  onRemove={removeCategory}
                  onUpdate={updateCategory}
                />
              )}
              {step === 3 && (
                <StepPricing
                  categories={categories}
                  currency={currency}
                  onUpdate={updateCategory}
                />
              )}
              {step === 4 && (
                <StepReview
                  name={name} city={city} currency={currency} timezone={timezone}
                  categories={categories}
                  totalRooms={totalRooms}
                  error={error}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => go(step + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Launching...</>
                ) : (
                  <><Rocket className="h-4 w-4" /> Launch My Hotel</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Identity ─────────────────────────────────────────────────────────

function StepIdentity({
  name, setName, city, setCity,
  currency, setCurrency, timezone, setTimezone,
}: {
  name: string; setName: (v: string) => void
  city: string; setCity: (v: string) => void
  currency: string; setCurrency: (v: string) => void
  timezone: string; setTimezone: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-foreground">
          Tell us about your property
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This is how guests and your team will identify your hotel.
        </p>
      </div>

      <div className="grid gap-4">
        <Field label="Hotel Name" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grand Ocean Hotel"
            className="input-field"
          />
        </Field>

        <Field label="City" required>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Nairobi"
            className="input-field"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Currency">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Timezone">
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input-field">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Inventory ────────────────────────────────────────────────────────

function StepInventory({
  categories, onAdd, onRemove, onUpdate,
}: {
  categories: RoomCategoryInput[]
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, field: keyof RoomCategoryInput, value: string | number) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-foreground">
          Set up your room categories
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Define the types of rooms you offer and how many of each you have.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {categories.map((cat, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Category Name
              </label>
              <input
                type="text"
                value={cat.name}
                onChange={(e) => onUpdate(i, "name", e.target.value)}
                placeholder="e.g. Deluxe Suite"
                className="input-field"
              />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                No. of Rooms
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={cat.roomCount}
                onChange={(e) => onUpdate(i, "roomCount", parseInt(e.target.value) || 1)}
                className="input-field text-center"
              />
            </div>
            {categories.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="mt-4 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 self-start rounded-lg border border-dashed border-primary/50 px-4 py-2 text-sm font-medium text-primary hover:border-primary hover:bg-primary/5"
      >
        <Plus className="h-4 w-4" />
        Add another category
      </button>
    </div>
  )
}

// ─── Step 3: Pricing ──────────────────────────────────────────────────────────

function StepPricing({
  categories, currency, onUpdate,
}: {
  categories: RoomCategoryInput[]
  currency: string
  onUpdate: (i: number, field: keyof RoomCategoryInput, value: string | number) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-foreground">
          Set your starting nightly rates
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          These base rates will be seeded for the next 30 days. You can adjust them
          at any time in the Rate Manager.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {categories.map((cat, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div>
              <p className="font-medium text-foreground">{cat.name || `Category ${i + 1}`}</p>
              <p className="text-xs text-muted-foreground">{cat.roomCount} rooms</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{currency}</span>
              <input
                type="number"
                min={1}
                value={cat.baseRate || ""}
                onChange={(e) => onUpdate(i, "baseRate", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="input-field w-28 text-right"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function StepReview({
  name, city, currency, timezone,
  categories, totalRooms, error,
}: {
  name: string; city: string; currency: string; timezone: string
  categories: RoomCategoryInput[]
  totalRooms: number
  error: string | null
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-sans text-2xl font-semibold text-foreground">
          Review &amp; launch
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Everything looks good? Hit Launch to create your property.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {/* Property header */}
        <div className="flex items-start gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Hotel className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">{city} · {currency} · {timezone.replace(/_/g, " ")}</p>
          </div>
        </div>

        {/* Room summary */}
        <div className="p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Room Inventory — {totalRooms} total rooms
          </p>
          <div className="flex flex-col gap-2">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{cat.name}</span>
                <span className="text-muted-foreground">
                  {cat.roomCount} rooms · {currency} {Number(cat.baseRate).toFixed(2)}/night
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* What gets created */}
        <div className="bg-primary/5 p-5">
          <p className="mb-2 text-xs font-medium text-primary">What will be created</p>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Property record with your settings</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> You as the Admin staff member</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> {categories.length} room {categories.length === 1 ? "category" : "categories"} with {totalRooms} physical rooms</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> 30-day rate calendar seeded from your base rates</li>
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Flexible &amp; Non-Refundable rate plans</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Reusable Field wrapper ───────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  )
}
