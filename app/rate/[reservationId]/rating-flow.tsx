"use client"

import { useState } from "react"
import { Star, CheckCircle } from "lucide-react"
import { submitGuestRating } from "@/lib/actions"

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "type" | "stars" | "tags" | "comment" | "success"

const STEPS: Step[] = ["type", "stars", "tags", "comment"]

const STEP_LABELS: Record<string, string> = {
  type:    "Type",
  stars:   "Stars",
  tags:    "Tags",
  comment: "Comment",
}

const FEEDBACK_TAGS = [
  { label: "Friendly",     positive: true  },
  { label: "Professional", positive: true  },
  { label: "Fast",         positive: true  },
  { label: "Mean",         positive: false },
  { label: "Inattentive",  positive: false },
  { label: "Dirty",        positive: false },
]

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current }: { current: Step }) {
  if (current === "success") return null
  const idx = STEPS.indexOf(current)
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, i) => {
        const done    = i < idx
        const active  = i === idx
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                  done   ? "bg-indigo-600 text-white"
                  : active ? "border-2 border-indigo-600 text-indigo-700 bg-indigo-50"
                  :           "bg-gray-100 text-gray-400",
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </div>
              <span className={`mt-1 text-[10px] font-medium ${active ? "text-indigo-700" : done ? "text-indigo-400" : "text-gray-400"}`}>
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 ${done ? "bg-indigo-600" : "bg-gray-200"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Star Selector ────────────────────────────────────────────────────────────

function StarSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="flex justify-center gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          <Star
            size={40}
            className={display >= n ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-300"}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RatingFlow({ reservationId }: { reservationId: number }) {
  const [step,         setStep]         = useState<Step>("type")
  const [ratingType,   setRatingType]   = useState<"check_in" | "stay" | null>(null)
  const [stars,        setStars]        = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment,      setComment]      = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  function selectType(type: "check_in" | "stay") {
    setRatingType(type)
    setStep("stars")
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit() {
    if (!ratingType || stars === 0) return
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await submitGuestRating(
        reservationId,
        ratingType,
        stars,
        selectedTags,
        comment.trim() || null,
      )
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.")
        return
      }
      setStep("success")
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-2xl font-bold text-indigo-600 tracking-tight">AuraStay</p>
          <p className="text-[11px] text-gray-400 uppercase tracking-widest mt-0.5">Guest Feedback</p>
        </div>

        <ProgressBar current={step} />

        {/* Step 1 — Type */}
        {step === "type" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">What would you like to rate?</h2>
              <p className="text-sm text-gray-500 mt-1">Help us improve your experience</p>
            </div>

            <button
              type="button"
              onClick={() => selectType("check_in")}
              className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-400 hover:bg-indigo-50 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <p className="font-semibold text-gray-900 text-sm">Check-In Experience</p>
              <p className="text-xs text-gray-500 mt-0.5">How was your arrival and check-in process?</p>
            </button>

            <button
              type="button"
              onClick={() => selectType("stay")}
              className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-400 hover:bg-indigo-50 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <p className="font-semibold text-gray-900 text-sm">Overall Stay</p>
              <p className="text-xs text-gray-500 mt-0.5">How was your overall experience during the stay?</p>
            </button>
          </div>
        )}

        {/* Step 2 — Stars */}
        {step === "stars" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {ratingType === "check_in" ? "Rate your check-in" : "Rate your stay"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Tap a star to select your rating</p>
            </div>

            <StarSelector value={stars} onChange={setStars} />

            <div className="flex justify-between text-xs text-gray-400 px-1">
              <span>Unsatisfied</span>
              <span>Very satisfied</span>
            </div>

            <button
              type="button"
              disabled={stars === 0}
              onClick={() => setStep("tags")}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Continue
            </button>

            <button
              type="button"
              onClick={() => setStep("type")}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 3 — Tags */}
        {step === "tags" && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">How would you describe it?</h2>
              <p className="text-sm text-gray-500 mt-1">Select any that apply (optional)</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_TAGS.map((tag) => {
                const active = selectedTags.includes(tag.label)
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => toggleTag(tag.label)}
                    className={[
                      "py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                      active
                        ? tag.positive
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                          : "bg-red-50 border-red-400 text-red-700"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600",
                    ].join(" ")}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep("comment")}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Continue
            </button>

            <button
              type="button"
              onClick={() => setStep("stars")}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 4 — Comment */}
        {step === "comment" && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Any additional feedback?</h2>
              <p className="text-sm text-gray-500 mt-1">Optional — your words help us improve</p>
            </div>

            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more about your experience..."
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm resize-none focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <span className="absolute bottom-3 right-3 text-xs text-gray-400">
                {comment.length}/500
              </span>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>

            <button
              type="button"
              onClick={() => setStep("tags")}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 5 — Success */}
        {step === "success" && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <CheckCircle size={56} className="text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your feedback has been received and will help us deliver a better experience for every guest.
            </p>
            <p className="text-xs text-gray-400 pt-2">You may now close this page.</p>
          </div>
        )}

      </div>
    </div>
  )
}
