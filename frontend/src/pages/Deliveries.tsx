import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck } from 'lucide-react'
import Header from '../components/Header'
import Breadcrumb from '../components/cart/Breadcrumb'
import { useCart } from '../lib/CartContext'
import { getMyOrders, type MyOrder } from '../lib/account'
import { formatCurrency } from '../lib/format'

// Standard Sales Order status values.
const STATUS_STYLE: Record<string, string> = {
  Completed: 'bg-emerald-50 text-emerald-700',
  'To Deliver': 'bg-amber-50 text-amber-700',
  'To Bill': 'bg-amber-50 text-amber-700',
  'To Deliver and Bill': 'bg-amber-50 text-amber-700',
  'To Pay': 'bg-amber-50 text-amber-700',
  Cancelled: 'bg-rose-50 text-rose-600',
  Closed: 'bg-slate-100 text-slate-600',
}

export default function Deliveries() {
  const { loggedIn } = useCart()
  const [orders, setOrders] = useState<MyOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false)
      return
    }
    getMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [loggedIn])

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />
      <main className="mx-auto w-full max-w-[1920px] px-6 py-8 lg:px-10">
        <Breadcrumb current="Delivery History" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Delivery History</h1>
        <p className="mt-1 text-slate-500">Every order you've placed and where it stands.</p>

        {!loggedIn && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="font-medium text-amber-900">You need to be logged in to see your deliveries.</p>
            <p className="mt-1 text-sm text-amber-800">
              <Link to="/login?redirect=/deliveries" className="underline">
                Log in or create an account
              </Link>{' '}
              to continue.
            </p>
          </div>
        )}

        {loggedIn && loading && <p className="mt-8 text-slate-500">Loading orders...</p>}

        {loggedIn && !loading && orders.length === 0 && (
          <div className="mt-8">
            <p className="text-slate-500">No orders yet.</p>
            <Link to="/products" className="mt-3 inline-block text-emerald-700 underline">
              Browse products
            </Link>
          </div>
        )}

        {loggedIn && !loading && orders.length > 0 && (
          <div className="mt-6 space-y-3">
            {orders.map((order) => (
              <div
                key={order.name}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex min-w-0 items-center gap-4 sm:flex-1">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{order.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                      <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {order.delivery_date
                        ? `Delivery on ${new Date(order.delivery_date).toLocaleDateString('en-IN')}`
                        : `Ordered ${new Date(order.transaction_date).toLocaleDateString('en-IN')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 pl-[60px] sm:flex-col sm:items-end sm:gap-1.5 sm:pl-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[order.status] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {order.status}
                  </span>
                  <p className="text-sm font-medium text-slate-900">{formatCurrency(order.grand_total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
