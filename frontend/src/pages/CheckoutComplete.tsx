import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Header from '../components/Header'
import { getOrderPaymentStatus, type OrderPaymentStatus } from '../lib/checkout'
import { formatCurrency } from '../lib/format'

export default function CheckoutComplete() {
  const [searchParams] = useSearchParams()
  const referenceDoctype = searchParams.get('rd') as 'Sales Order' | 'Sales Invoice' | null
  const referenceName = searchParams.get('rn')

  const [status, setStatus] = useState<OrderPaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!referenceDoctype || !referenceName) {
      setLoading(false)
      return
    }
    getOrderPaymentStatus(referenceDoctype, referenceName)
      .then(setStatus)
      .finally(() => setLoading(false))
  }, [referenceDoctype, referenceName])

  // Trust nothing the browser did to get here -- a Payment Entry actually
  // submitted and linked to this order/invoice server-side is the only real
  // signal that money landed, regardless of how the redirect happened.
  const paid = (status?.paymentEntries.length ?? 0) > 0

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-16 text-center">
        {loading && <Loader2 className="h-8 w-8 animate-spin text-emerald-700" aria-hidden />}

        {!loading && !referenceName && (
          <>
            <XCircle className="h-10 w-10 text-red-500" strokeWidth={1.5} aria-hidden />
            <h1 className="mt-4 text-xl font-semibold text-slate-900">No order to check</h1>
          </>
        )}

        {!loading && referenceName && paid && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-semibold text-slate-900">Payment received</h1>
            <p className="mt-2 text-sm text-slate-500">
              {referenceName} is confirmed{status?.order && ` for ${formatCurrency(status.order.grand_total)}`}.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Payment Entry {status?.paymentEntries[0]?.name} recorded against this {referenceDoctype?.toLowerCase()}.
            </p>
          </>
        )}

        {!loading && referenceName && !paid && (
          <>
            <XCircle className="h-10 w-10 text-amber-500" strokeWidth={1.5} aria-hidden />
            <h1 className="mt-4 text-xl font-semibold text-slate-900">Payment not confirmed yet</h1>
            <p className="mt-2 text-sm text-slate-500">
              We couldn't find a completed payment for {referenceName}. If money was deducted, it may still be
              processing -- please check back shortly.
            </p>
          </>
        )}

        <Link to="/" className="mt-6 text-sm font-medium text-emerald-700 underline">
          Back to home
        </Link>
      </main>
    </div>
  )
}
