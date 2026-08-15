import { useState, type FormEvent } from 'react'
import { Star, X } from 'lucide-react'
import { submitItemReview } from '../lib/api'
import { extractErrorMessage } from '../lib/cart'

interface Props {
  websiteItemName: string
  itemName: string
  onClose: () => void
  onSubmitted: () => void
}

export default function ReviewModal({ websiteItemName, itemName, onClose, onSubmitted }: Props) {
  const [stars, setStars] = useState(0)
  const [hoverStars, setHoverStars] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (stars === 0) {
      setError('Please select a star rating.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await submitItemReview(websiteItemName, title || itemName, stars, comment)
      onSubmitted()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Write a Review</h3>
            <p className="text-sm text-slate-500">{itemName}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex justify-center gap-1" onMouseLeave={() => setHoverStars(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                onMouseEnter={() => setHoverStars(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  className={`h-7 w-7 ${
                    n <= (hoverStars || stars) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                  }`}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think? (optional)"
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
