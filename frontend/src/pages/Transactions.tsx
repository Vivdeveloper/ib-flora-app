import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Receipt, CircleCheck } from 'lucide-react'
import Header from '../components/Header'
import Breadcrumb from '../components/cart/Breadcrumb'
import { useCart } from '../lib/CartContext'
import { getMyOrders, getMyPayments, type MyOrder, type MyPayment } from '../lib/account'
import { formatCurrency } from '../lib/format'

export default function Transactions() {
  const { loggedIn } = useCart()
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [payments, setPayments] = useState<MyPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false)
      return
    }
    getMyOrders()
      .then(async (myOrders) => {
        setOrders(myOrders)
        setPayments(await getMyPayments(myOrders.map((o) => o.name)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loggedIn])

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />
      <main className="mx-auto w-full max-w-[1920px] px-6 py-8 lg:px-10">
        <Breadcrumb current="Transactions and Invoices" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Transactions and Invoices</h1>
        <p className="mt-1 text-slate-500">Every order and payment on your account.</p>

        {!loggedIn && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="font-medium text-amber-900">You need to be logged in to see your transactions.</p>
            <p className="mt-1 text-sm text-amber-800">
              <Link to="/login?redirect=/transactions" className="underline">
                Log in or create an account
              </Link>{' '}
              to continue.
            </p>
          </div>
        )}

        {loggedIn && loading && <p className="mt-8 text-slate-500">Loading transactions...</p>}

        {loggedIn && !loading && orders.length === 0 && (
          <p className="mt-8 text-slate-500">No orders or payments yet.</p>
        )}

        {loggedIn && !loading && orders.length > 0 && (
          <div className="mt-6 space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-slate-900">Orders</h2>
              <div className="mt-3 space-y-2.5">
                {orders.map((order) => (
                  <div
                    key={order.name}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 shadow-sm"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <Receipt className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{order.name}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(order.transaction_date).toLocaleDateString('en-IN')} · {order.status}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{formatCurrency(order.grand_total)}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-900">Payments</h2>
              {payments.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No payments recorded yet.</p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {payments.map((payment) => (
                    <div
                      key={payment.name}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 shadow-sm"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <CircleCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">{payment.name}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(payment.posting_date).toLocaleDateString('en-IN')} · For {payment.reference_name}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-emerald-700">
                        {formatCurrency(payment.paid_amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
