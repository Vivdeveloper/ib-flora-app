import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CreditCard, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import Header from '../components/Header'
import {
  createPaymentRequest,
  confirmRazorpayPayment,
  type RazorpayCheckoutParams,
  type RazorpaySuccessResponse,
} from '../lib/checkout'
import { extractErrorMessage } from '../lib/cart'
import { formatCurrency } from '../lib/format'

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'
const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-js'

// Razorpay's own hosted checkout widget -- loaded from their CDN and opened
// with server-issued params, so card details never touch this app. Not a
// custom payment form; see ib_flora.api.create_payment_request for how the
// params below are produced (100% standard Payment Request -> Razorpay flow).
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void }
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const existing = document.getElementById(RAZORPAY_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout')))
      return
    }
    const script = document.createElement('script')
    script.id = RAZORPAY_SCRIPT_ID
    script.src = RAZORPAY_SCRIPT_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.body.appendChild(script)
  })
}

export default function CheckoutPayment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const referenceDoctype = searchParams.get('rd') as 'Sales Order' | 'Sales Invoice' | null
  const referenceName = searchParams.get('rn')

  const [params, setParams] = useState<RazorpayCheckoutParams | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const preparePromiseRef = useRef<Promise<[RazorpayCheckoutParams, void]> | null>(null)

  useEffect(() => {
    if (!referenceDoctype || !referenceName) {
      setError('No order to pay for.')
      return
    }

    let cancelled = false

    // React StrictMode (dev only) invokes effects twice on mount. Memoizing
    // the in-flight promise on a ref -- instead of a boolean "already
    // started" flag -- means a second invocation reuses the same request
    // (so createPaymentRequest still only fires once against a backend
    // that isn't safely idempotent for that) while still registering its
    // own `cancelled`-guarded handler, so the surviving mount actually gets
    // to call setParams when the shared promise resolves. A boolean guard
    // that blocks re-entry outright breaks this: the first mount's cleanup
    // marks *its own* `cancelled` true before the request resolves, and if
    // that's the only invocation allowed to run, nothing ever updates state.
    if (!preparePromiseRef.current) {
      preparePromiseRef.current = Promise.all([
        createPaymentRequest(referenceDoctype, referenceName),
        loadRazorpayScript(),
      ])
    }

    preparePromiseRef.current
      .then(([checkoutParams]) => {
        if (!cancelled) setParams(checkoutParams)
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err))
      })

    return () => {
      cancelled = true
    }
  }, [referenceDoctype, referenceName])

  // Fetching params happens in the background as soon as the page loads, but
  // rzp.open() only ever runs inside this direct click handler -- some
  // browsers gate the iframe's "payment" permission on transient user
  // activation, so opening it from an async callback with no live user
  // gesture can silently fail to render.
  function handlePayNow() {
    if (!params) return
    setError(null)

    const options = {
      key: params.key,
      amount: params.amount,
      currency: params.currency,
      name: params.name,
      description: params.description,
      order_id: params.order_id,
      prefill: params.prefill,
      handler: async (response: RazorpaySuccessResponse) => {
        setConfirming(true)
        try {
          await confirmRazorpayPayment(params, response)
          navigate(
            `/checkout/complete?rd=${encodeURIComponent(referenceDoctype as string)}&rn=${encodeURIComponent(referenceName as string)}`,
          )
        } catch (err) {
          setError(extractErrorMessage(err))
        } finally {
          setConfirming(false)
        }
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-16 text-center">
        {error ? (
          <>
            <XCircle className="h-10 w-10 text-red-500" strokeWidth={1.5} aria-hidden />
            <h1 className="mt-4 text-xl font-semibold text-slate-900">Couldn't start payment</h1>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Link to="/cart" className="mt-6 text-sm font-medium text-emerald-700 underline">
              Back to cart
            </Link>
          </>
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-7 w-7" strokeWidth={1.75} aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              {params ? 'Ready to pay' : 'Preparing secure payment...'}
            </h1>
            {params && (
              <p className="mt-2 text-sm text-slate-500">
                {formatCurrency(params.amount / 100)} for {referenceName}
              </p>
            )}

            {!params && <Loader2 className="mt-6 h-6 w-6 animate-spin text-emerald-700" aria-hidden />}

            {params && (
              <button
                onClick={handlePayNow}
                disabled={confirming}
                className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" strokeWidth={2} aria-hidden />
                {confirming ? 'Confirming payment...' : 'Pay Now with Razorpay'}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
