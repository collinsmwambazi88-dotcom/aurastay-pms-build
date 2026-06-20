'use client'

import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { submitGuestRating } from '@/lib/actions'

// ─── Constants ────────────────────────────────────────────────────────────────

const FEEDBACK_TAGS = [
  { label: 'Friendly',     value: 'Friendly',     positive: true  },
  { label: 'Professional', value: 'Professional', positive: true  },
  { label: 'Fast',         value: 'Fast',         positive: true  },
  { label: 'Mean',         value: 'Mean',         positive: false },
  { label: 'Inattentive',  value: 'Inattentive',  positive: false },
  { label: 'Dirty',        value: 'Dirty',        positive: false },
]

type Step = 'rating-type' | 'stars' | 'tags' | 'comment' | 'success'

const PROGRESS_STEPS: Step[] = ['rating-type', 'stars', 'tags', 'comment']

const STEP_LABELS: Record<string, string> = {
  'rating-type': 'Type',
  stars:         'Stars',
  tags:          'Tags',
  comment:       'Comment',
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  if (step === 'success') return null
  const currentIndex = PROGRESS_STEPS.indexOf(step)

  return (
    <div className="mb-8 flex items-center justify-between">
      {PROGRESS_STEPS.map((s, i) => {
        const isDone    = i < currentIndex
        const isCurrent = i === currentIndex
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isDone
                    ? 'bg-indigo-600 text-white'
                    : isCurrent
                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isCurrent ? 'text-indigo-700' : isDone ? 'text-indigo-500' : 'text-gray-400'
                }`}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 transition-all duration-300 ${
                  isDone ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Star selector ────────────────────────────────────────────────────────────

function StarSelector({
  value,
  onChange,
}: {
  value: number | null
  onChange: (n: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="flex justify-center gap-2" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hovered ?? value ?? 0) >= n
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(n)}
            className="transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            <Star
              size={40}
              className={`transition-colors duration-150 ${
                filled ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

// ─── Main interactive component ───────────────────────────────────────────────

export default function RatingFlow({ reservationId }: { reservationId: number }) {
  const [step,         setStep]         = useState<Step>('rating-type')
  const [ratingType,   setRatingType]   = useState<'check_in' | 'stay' | null>(null)
  const [stars,        setStars]        = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment,      setComment]      = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  function handleRatingTypeSelect(type: 'check_in' | 'stay') {
    setRatingType(type)
    setStep('stars')
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  async function handleSubmit() {
    if (!ratingType || !stars) return
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
        setError(result.error ?? 'Failed to submit rating.')
        return
      }
      setStep('success')
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fadeIn = 'animate-in fade-in slide-in-from-bottom-2 duration-300'

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 md:p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold tracking-tight text-indigo-600">AuraStay</div>
          <p className="text-gray-500 text-xs mt-0.5 uppercase tracking-widest">Guest Feedback</p>
        </div>

        <ProgressBar step={step} />

        {/* Step 1 — Rating Type */}
        {step === 'rating-type' && (
          <div className={`space-y-4 ${fadeIn}`}>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">What would you like to rate?</h2>
              <p className="text-gray-500 text-sm mt-1">Help us improve your experience</p>
            </div>
            {(
              [
                { type: 'check_in' as const, title: 'Check-In Experience', description: 'How was your arrival and check-in process?' },
                { type: 'stay'     as const, title: 'Overall Stay',         description: 'How was your overall experience during the stay?' },
              ]
            ).map(({ type, title, description }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleRatingTypeSelect(type)}
                className="w-full p-4 border-2 border-indigo-100 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 active:scale-[0.98] transition-all duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="font-semibold text-gray-900 text-sm">{title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Stars */}
        {step === 'stars' && (
          <div className={`space-y-6 ${fadeIn}`}>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {ratingType === 'check_in' ? 'Rate your check-in' : 'Rate your stay'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">Tap a star to continue</p>
            </div>

            <StarSelector
              value={stars}
              onChange={(n) => {
                setStars(n)
                setStep('tags')
              }}
            />

            <div className="flex justify-between text-xs text-gray-400 px-1">
              <span>Unsatisfied</span>
              <span>Very satisfied</span>
            </div>

            <button
              type="button"
              disabled={!stars}
              onClick={() => setStep('tags')}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3 — Tags */}
        {step === 'tags' && (
          <div className={`space-y-5 ${fadeIn}`}>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">How would you describe it?</h2>
              <p className="text-gray-500 text-sm mt-1">Select any tags that apply (optional)</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_TAGS.map((tag) => {
                const active = selectedTags.includes(tag.value)
                return (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTag(tag.value)}
                    className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      active
                        ? tag.positive
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-red-50 border-red-400 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setStep('comment')}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => setStep('stars')}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 4 — Comment */}
        {step === 'comment' && (
          <div className={`space-y-5 ${fadeIn}`}>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Any additional feedback?</h2>
              <p className="text-gray-500 text-sm mt-1">Optional — your words help us improve</p>
            </div>
            <div className="relative">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more about your experience..."
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none resize-none transition-colors"
              />
              <span className="absolute bottom-3 right-3 text-xs text-gray-400">
                {comment.length}/500
              </span>
            </div>
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              onClick={() => setStep('tags')}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 5 — Success */}
        {step === 'success' && (
          <div className={`text-center space-y-4 py-4 ${fadeIn}`}>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <Star size={32} className="fill-indigo-600 text-indigo-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your feedback has been received and will help us improve our service.
            </p>
            <p className="text-xs text-gray-400 pt-2">You may now close this page.</p>
          </div>
        )}

      </div>
    </div>
  )
}
