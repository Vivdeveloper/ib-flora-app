import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Loader2, ShieldCheck, XCircle } from 'lucide-react'
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
  const salesOrder = searchParams.get('so')

  const [params, setParams] = useState<RazorpayCheckoutParams | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const opening = useRef(false)
  const started = useRef(false)

  useEffect(() => {
    if (!salesOrder) {
      setError('No order to pay for.')
      return
    }

    // React StrictMode (dev only) invokes effects twice on mount -- without
    // this guard that fires createPaymentRequest twice, and the backend's
    // idempotency check on the second call surfaces as a spurious error.
    if (started.current) return
    started.current = true

    let cancelled = false

    async function start() {
      try {
        const [checkoutParams] = await Promise.all([
          createPaymentRequest(salesOrder as string),
          loadRazorpayScript(),
        ])
        if (cancelled) return
        setParams(checkoutParams)
        openRazorpay(checkoutParams)
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err))
      }
    }

    start()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrder])

  function openRazorpay(checkoutParams: RazorpayCheckoutParams) {
    if (opening.current) return
    opening.current = true
    setDismissed(false)

    const options = {
      key: checkoutParams.key,
      amount: checkoutParams.amount,
      currency: checkoutParams.currency,
      name: checkoutParams.name,
      description: checkoutParams.description,
      order_id: checkoutParams.order_id,
      prefill: checkoutParams.prefill,
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          await confirmRazorpayPayment(checkoutParams, response)
          navigate(`/checkout/complete?so=${encodeURIComponent(salesOrder as string)}`)
        } catch (err) {
          setError(extractErrorMessage(err))
        } finally {
          opening.current = false
        }
      },
      modal: {
        ondismiss: () => {
          opening.current = false
          setDismissed(true)
        },
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
              {params ? 'Complete your payment' : 'Preparing secure payment...'}
            </h1>
            {params && (
              <p className="mt-2 text-sm text-slate-500">
                {formatCurrency(params.amount / 100)} for order {salesOrder}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">Razorpay's secure checkout will open automatically.</p>

            {!params && (
              <Loader2 className="mt-6 h-6 w-6 animate-spin text-emerald-700" aria-hidden />
            )}

            {dismissed && params && (
              <button
                onClick={() => openRazorpay(params)}
                className="mt-6 rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
              >
                Reopen Payment
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
