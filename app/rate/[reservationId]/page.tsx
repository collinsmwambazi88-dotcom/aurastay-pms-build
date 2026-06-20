'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitGuestRating } from '@/lib/actions'
import { Button } from '@/components/ui/button'

const FEEDBACK_TAGS = [
  { label: 'Friendly', value: 'Friendly', emoji: '😊' },
  { label: 'Professional', value: 'Professional', emoji: '👔' },
  { label: 'Fast', value: 'Fast', emoji: '⚡' },
  { label: 'Mean', value: 'Mean', emoji: '😠' },
  { label: 'Inattentive', value: 'Inattentive', emoji: '😐' },
  { label: 'Dirty', value: 'Dirty', emoji: '🧹' },
]

const STARS = [1, 2, 3, 4, 5]

interface PageProps {
  params: {
    reservationId: string
  }
}

export default function RatingPage({ params }: PageProps) {
  const router = useRouter()
  const reservationId = parseInt(params.reservationId)

  const [step, setStep] = useState<'rating-type' | 'stars' | 'tags' | 'comment' | 'success'>('rating-type')
  const [ratingType, setRatingType] = useState<'check_in' | 'stay' | null>(null)
  const [stars, setStars] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRatingTypeSelect = (type: 'check_in' | 'stay') => {
    setRatingType(type)
    setStep('stars')
  }

  const handleStarSelect = (rating: number) => {
    setStars(rating)
    setStep('tags')
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const handleTagsNext = () => {
    setStep('comment')
  }

  const handleCommentSubmit = async () => {
    if (!ratingType || !stars) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitGuestRating(
        reservationId,
        ratingType,
        stars,
        selectedTags,
        comment || null,
      )

      if (!result.ok) {
        setError(result.error || 'Failed to submit rating')
        setIsSubmitting(false)
        return
      }

      setStep('success')
    } catch (err) {
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-indigo-600 mb-2">AuraStay</div>
          <p className="text-gray-600 text-sm">Guest Feedback</p>
        </div>

        {/* Rating Type Selection */}
        {step === 'rating-type' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What would you like to rate?</h2>
              <p className="text-gray-600">Help us improve your experience</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleRatingTypeSelect('check_in')}
                className="w-full p-4 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-colors text-left"
              >
                <div className="font-semibold text-gray-900">Check-In Experience</div>
                <div className="text-sm text-gray-600">How was your arrival and check-in process?</div>
              </button>

              <button
                onClick={() => handleRatingTypeSelect('stay')}
                className="w-full p-4 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-colors text-left"
              >
                <div className="font-semibold text-gray-900">Overall Stay</div>
                <div className="text-sm text-gray-600">How was your overall experience during the stay?</div>
              </button>
            </div>
          </div>
        )}

        {/* Star Rating */}
        {step === 'stars' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {ratingType === 'check_in' ? 'Rate your check-in' : 'Rate your stay'}
              </h2>
              <p className="text-gray-600 text-sm">1 = Unsatisfied, 5 = Very Satisfied</p>
            </div>

            <div className="flex justify-center gap-3">
              {STARS.map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarSelect(star)}
                  className={`text-4xl transition-transform hover:scale-110 ${
                    stars === star ? 'scale-110' : ''
                  }`}
                >
                  {stars && stars >= star ? (
                    <span className="text-yellow-400">★</span>
                  ) : (
                    <span className="text-gray-300">★</span>
                  )}
                </button>
              ))}
            </div>

            <Button
              onClick={() => setStep('tags')}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Feedback Tags */}
        {step === 'tags' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select tags that apply</h2>
              <p className="text-gray-600 text-sm">(Optional - select as many as you&apos;d like)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FEEDBACK_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex flex-col items-center gap-1 ${
                    selectedTags.includes(tag.value)
                      ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                      : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-xl">{tag.emoji}</span>
                  {tag.label}
                </button>
              ))}
            </div>

            <Button
              onClick={handleTagsNext}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Next
            </Button>
          </div>
        )}

        {/* Comment */}
        {step === 'comment' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Any additional feedback?</h2>
              <p className="text-gray-600 text-sm">(Optional)</p>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none resize-none h-32"
              maxLength={500}
            />

            <div className="text-xs text-gray-500">
              {comment.length}/500 characters
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleCommentSubmit}
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>

            <button
              onClick={() => setStep('tags')}
              className="w-full p-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              Back
            </button>
          </div>
        )}

        {/* Success Message */}
        {step === 'success' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl">✨</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600">Your feedback has been received and will help us improve our service.</p>
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-500">You can now close this page.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
