import { useEffect, useState, type FormEvent } from 'react'
import { Calendar, MapPin, Pause, Play, X } from 'lucide-react'
import Header from '../components/Header'
import Breadcrumb from '../components/cart/Breadcrumb'
import { useCart } from '../lib/CartContext'
import { checkDeliveryZone, type DeliveryZoneCheck } from '../lib/api'
import { getItemDetails, extractErrorMessage } from '../lib/cart'
import { backendUrl } from '../lib/backend'
import {
  getSubscriptionPlans,
  getMySubscriptions,
  createSubscription,
  pauseSubscription,
  resumeSubscription,
  type SubscriptionPlan,
  type MySubscription,
} from '../lib/subscriptions'
import { formatCurrency } from '../lib/format'

const DEFAULT_PINCODE = '411057'
const BILLING_LABEL: Record<string, string> = { Day: '/day', Week: '/week', Month: '/month', Year: '/year' }

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function Subscriptions() {
  const { loggedIn } = useCart()

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [itemImages, setItemImages] = useState<Record<string, string | null>>({})
  const [loadingPlans, setLoadingPlans] = useState(true)

  const [mySubs, setMySubs] = useState<MySubscription[]>([])
  const [loadingSubs, setLoadingSubs] = useState(true)

  const [subscribingPlan, setSubscribingPlan] = useState<SubscriptionPlan | null>(null)
  const [pausingName, setPausingName] = useState<string | null>(null)

  useEffect(() => {
    getSubscriptionPlans()
      .then(async (rows) => {
        setPlans(rows)
        const details = await getItemDetails(rows.map((r) => r.item))
        setItemImages(Object.fromEntries(Object.entries(details).map(([code, d]) => [code, d.website_image])))
      })
      .finally(() => setLoadingPlans(false))
  }, [])

  async function refreshMySubs() {
    if (!loggedIn) {
      setLoadingSubs(false)
      return
    }
    setLoadingSubs(true)
    try {
      setMySubs(await getMySubscriptions())
    } finally {
      setLoadingSubs(false)
    }
  }

  useEffect(() => {
    refreshMySubs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn])

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="mx-auto w-full max-w-[1920px] px-6 py-8 lg:px-10">
        <Breadcrumb current="Subscriptions" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
        <p className="mt-1 text-slate-500">
          Never run out -- fresh flowers and puja essentials, delivered on a schedule.
        </p>

        {loadingPlans ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 p-3">
                <div className="h-40 animate-pulse rounded-xl bg-slate-200/70" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-200/70" />
                <div className="mt-1 h-4 w-1/3 animate-pulse rounded bg-slate-200/70" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className="rounded-2xl border border-slate-100 p-3 shadow-sm">
                <div className="relative h-40 overflow-hidden rounded-xl bg-slate-100">
                  {itemImages[plan.item] ? (
                    <img
                      src={itemImages[plan.item] as string}
                      alt={plan.plan_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="font-medium text-slate-900">{plan.plan_name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Delivered every {plan.billing_interval.toLowerCase()}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatCurrency(plan.cost)}{' '}
                    <span className="text-slate-400">{BILLING_LABEL[plan.billing_interval] ?? ''}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSubscribingPlan(plan)}
                  disabled={!loggedIn}
                  title={loggedIn ? undefined : 'Log in at /app/login to subscribe'}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">My Subscriptions</h2>

          {!loggedIn && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="font-medium text-amber-900">You need to be logged in to see your subscriptions.</p>
              <p className="mt-1 text-sm text-amber-800">
                Log in at{' '}
                <a href={backendUrl('/app/login')} className="underline">
                  /app/login
                </a>{' '}
                in this browser, then come back here.
              </p>
            </div>
          )}

          {loggedIn && loadingSubs && <p className="mt-4 text-slate-500">Loading subscriptions...</p>}

          {loggedIn && !loadingSubs && mySubs.length === 0 && (
            <p className="mt-4 text-slate-500">No subscriptions yet -- subscribe to a plan above.</p>
          )}

          {loggedIn && !loadingSubs && mySubs.length > 0 && (
            <div className="mt-4 space-y-3">
              {mySubs.map((sub) => (
                <SubscriptionRow
                  key={sub.name}
                  sub={sub}
                  onChanged={refreshMySubs}
                  onPause={() => setPausingName(sub.name)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {subscribingPlan && (
        <SubscribeModal
          plan={subscribingPlan}
          onClose={() => setSubscribingPlan(null)}
          onSubscribed={() => {
            setSubscribingPlan(null)
            refreshMySubs()
          }}
        />
      )}

      {pausingName && (
        <PauseModal
          name={pausingName}
          onClose={() => setPausingName(null)}
          onPaused={() => {
            setPausingName(null)
            refreshMySubs()
          }}
        />
      )}
    </div>
  )
}

function SubscriptionRow({
  sub,
  onChanged,
  onPause,
}: {
  sub: MySubscription
  onChanged: () => void
  onPause: () => void
}) {
  const [resuming, setResuming] = useState(false)

  async function handleResume() {
    setResuming(true)
    try {
      await resumeSubscription(sub.name)
      onChanged()
    } finally {
      setResuming(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-slate-900">{sub.plan_name ?? sub.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              sub.is_paused ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {sub.is_paused ? 'Paused' : sub.status}
          </span>
          {sub.delivery_zone && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {sub.delivery_zone}
            </span>
          )}
          {sub.next_invoice_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden /> Next:{' '}
              {new Date(sub.next_invoice_date).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>
      </div>
      <div>
        {sub.is_paused ? (
          <button
            onClick={handleResume}
            disabled={resuming}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" aria-hidden /> {resuming ? 'Resuming...' : 'Resume'}
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Pause className="h-3.5 w-3.5" aria-hidden /> Pause
          </button>
        )}
      </div>
    </div>
  )
}

function SubscribeModal({
  plan,
  onClose,
  onSubscribed,
}: {
  plan: SubscriptionPlan
  onClose: () => void
  onSubscribed: () => void
}) {
  const [pincode, setPincode] = useState(DEFAULT_PINCODE)
  const [zone, setZone] = useState<DeliveryZoneCheck | null>(null)
  const [checking, setChecking] = useState(false)
  const [startDate, setStartDate] = useState(todayIso)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckZone(e: FormEvent) {
    e.preventDefault()
    setChecking(true)
    setError(null)
    try {
      setZone(await checkDeliveryZone(pincode))
    } catch {
      setError('Could not check delivery zone.')
    } finally {
      setChecking(false)
    }
  }

  async function handleConfirm() {
    if (!zone?.zone_found || !zone.name) return
    setSubmitting(true)
    setError(null)
    try {
      await createSubscription(plan.item, plan.name, zone.name, startDate)
      onSubscribed()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Subscribe</h3>
            <p className="text-sm text-slate-500">{plan.plan_name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Delivery pincode</label>
            <form onSubmit={handleCheckZone} className="mt-1 flex gap-2">
              <input
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value)
                  setZone(null)
                }}
                placeholder="Pincode"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="submit"
                disabled={checking}
                className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {checking ? '...' : 'Check'}
              </button>
            </form>
            {zone &&
              (zone.zone_found ? (
                <p className="mt-1.5 text-sm text-emerald-700">Delivers to {zone.territory}.</p>
              ) : (
                <p className="mt-1.5 text-sm text-rose-600">We don't deliver to this pincode yet.</p>
              ))}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={submitting || !zone?.zone_found}
            className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
          >
            {submitting ? 'Subscribing...' : 'Confirm Subscription'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PauseModal({ name, onClose, onPaused }: { name: string; onClose: () => void; onPaused: () => void }) {
  const [pauseFrom, setPauseFrom] = useState(todayIso)
  const [pauseTo, setPauseTo] = useState(todayIso)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      await pauseSubscription(name, pauseFrom, pauseTo)
      onPaused()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Pause Subscription</h3>
            <p className="text-sm text-slate-500">{name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Pause from</label>
            <input
              type="date"
              value={pauseFrom}
              onChange={(e) => setPauseFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Pause to</label>
            <input
              type="date"
              value={pauseTo}
              onChange={(e) => setPauseTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? 'Pausing...' : 'Confirm Pause'}
          </button>
        </div>
      </div>
    </div>
  )
}
