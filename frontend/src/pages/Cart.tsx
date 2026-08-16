import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Plus, Minus, Trash2, ChevronDown, Tag, Lock, Info, Flower2 } from 'lucide-react'
import Header from '../components/Header'
import IconTooltip from '../components/Tooltip'
import Breadcrumb from '../components/cart/Breadcrumb'
import StepBadge from '../components/cart/StepBadge'
import TrustBadges from '../components/cart/TrustBadges'
import { useCart } from '../lib/CartContext'
import { checkDeliveryZone, type DeliveryZoneCheck } from '../lib/api'
import { formatTime, formatCurrency } from '../lib/format'
import {
  getShippingAddresses,
  addShippingAddress,
  selectShippingAddress,
  applyCoupon,
  removeCoupon,
  setCartNotes,
  placeOrder,
  getAddressPincode,
  extractErrorMessage,
  type AddressOption,
} from '../lib/cart'

const DEFAULT_PINCODE = '411057'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, loading, loggedIn, refresh, setQty } = useCart()

  const [zone, setZone] = useState<DeliveryZoneCheck | null>(null)

  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const [addresses, setAddresses] = useState<AddressOption[]>([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    address_title: '',
    address_line1: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    phone: '',
  })
  const [savingAddress, setSavingAddress] = useState(false)

  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const [billDetailsOpen, setBillDetailsOpen] = useState(false)

  useEffect(() => {
    checkDeliveryZone(DEFAULT_PINCODE).then(setZone).catch(() => {})
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    setAddressesLoading(true)
    getShippingAddresses()
      .then(setAddresses)
      .catch(() => {})
      .finally(() => setAddressesLoading(false))
  }, [loggedIn])

  useEffect(() => {
    setNotes(cart.additionalNotes)
  }, [cart.additionalNotes])

  async function handleSelectAddress(name: string) {
    await selectShippingAddress(name)
    await refresh()
  }

  async function handleAddAddress(e: FormEvent) {
    e.preventDefault()
    if (!cart.partyDoctype || !cart.partyName) return
    setSavingAddress(true)
    try {
      const created = await addShippingAddress(addressForm, cart.partyDoctype, cart.partyName)
      await selectShippingAddress(created.name)
      const fresh = await getShippingAddresses()
      setAddresses(fresh)
      setShowAddressForm(false)
      setAddressForm({
        address_title: '',
        address_line1: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        phone: '',
      })
      await refresh()
    } finally {
      setSavingAddress(false)
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    try {
      await setCartNotes(notes)
      await refresh()
      setNotesOpen(false)
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleApplyCoupon(e: FormEvent) {
    e.preventDefault()
    setCouponError(null)
    setApplyingCoupon(true)
    try {
      await applyCoupon(couponInput)
      setCouponInput('')
      await refresh()
    } catch (err) {
      setCouponError(extractErrorMessage(err))
    } finally {
      setApplyingCoupon(false)
    }
  }

  async function handleRemoveCoupon() {
    await removeCoupon()
    await refresh()
  }

  async function handleCheckout() {
    setCheckoutError(null)

    if (!cart.shippingAddressName) {
      setCheckoutError('Please select a delivery address before checkout.')
      return
    }

    setCheckingOut(true)
    try {
      // Re-check the delivery zone against the address actually selected for
      // this order, not the page's default estimate above -- addresses can
      // be swapped right up until checkout.
      const pincode = await getAddressPincode(cart.shippingAddressName)
      const zoneCheck = pincode ? await checkDeliveryZone(pincode) : null
      if (!zoneCheck?.zone_found || !zoneCheck.is_active) {
        setCheckoutError("Sorry, we don't currently deliver to this address's pincode.")
        return
      }

      const salesOrder = await placeOrder()
      navigate(`/checkout/payment?rd=Sales%20Order&rn=${encodeURIComponent(salesOrder)}`)
    } catch (err) {
      setCheckoutError(extractErrorMessage(err))
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-6 py-6 lg:px-10">
        <Breadcrumb
          current="Review Cart"
          crumbs={[
            { label: 'Home', to: '/' },
            { label: 'Cart', to: '/cart' },
          ]}
        />

        <div>
          <div className="relative mt-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Review Cart</h1>
            <p className="mt-1 text-slate-500">Almost there! Review your items and delivery details.</p>
            <img
              src="/illustrations/cart-flower.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute -right-1 -top-3 h-16 w-16 object-contain sm:-right-2 sm:-top-6 sm:h-24 sm:w-24 md:h-28 md:w-28"
            />
          </div>

          {!loggedIn && (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="font-medium text-amber-900">You need to be logged in to use the cart.</p>
              <p className="mt-1 text-sm text-amber-800">
                <Link to="/login?redirect=/cart" className="underline">
                  Log in or create an account
                </Link>{' '}
                to continue.
              </p>
            </div>
          )}

          {loggedIn && loading && <p className="mt-8 text-slate-500">Loading cart...</p>}

          {loggedIn && !loading && cart.items.length === 0 && (
            <div className="mt-8">
              <p className="text-slate-500">Your cart is empty.</p>
              <Link to="/products" className="mt-3 inline-block text-emerald-700 underline">
                Browse products
              </Link>
            </div>
          )}

          {loggedIn && !loading && cart.items.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
              {/* Left: Delivery */}
              <div>
                <div className="rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <StepBadge step={1} />
                    <h2 className="font-semibold text-slate-900">Delivery</h2>
                  </div>

                  {zone?.zone_found && (
                    <div className="mt-3 flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                        <Flower2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                      </span>
                      <div className="text-sm">
                        <p className="font-semibold text-emerald-700">
                          Delivery {zone.same_day_eligible ? 'today' : 'tomorrow'} by{' '}
                          {formatTime(zone.delivery_end)}
                        </p>
                        <p className="text-slate-500">
                          Order by {formatTime(zone.cutoff_time)}
                          {zone.same_day_eligible ? ' today' : ' tomorrow'} for this slot
                        </p>
                      </div>
                    </div>
                  )}

                  <h3 className="mt-6 text-sm font-semibold text-slate-900">Delivery Address</h3>

                  {addressesLoading && <p className="mt-2 text-sm text-slate-400">Loading addresses...</p>}

                  {!addressesLoading && (
                    <div className="mt-3 space-y-2.5">
                      {addresses.map((addr) => {
                        const selected = cart.shippingAddressName === addr.name
                        return (
                          <label
                            key={addr.name}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                              selected
                                ? 'border-emerald-600 bg-emerald-50/50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="shipping-address"
                              checked={selected}
                              onChange={() => handleSelectAddress(addr.name)}
                              className="sr-only"
                            />
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                selected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              <MapPin className="h-4 w-4" strokeWidth={2} aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900">{addr.title}</p>
                                {selected && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 text-sm text-slate-500">
                                {addr.display.split(/<br\s*\/?>/i).map((line, i) =>
                                  line.trim() ? <p key={i}>{line.trim()}</p> : null,
                                )}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {!showAddressForm ? (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-emerald-400 py-3 text-center font-medium text-emerald-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden /> Add New Address
                    </button>
                  ) : (
                    <form onSubmit={handleAddAddress} className="mt-3 space-y-2 rounded-xl border border-slate-200 p-4">
                      <input
                        required
                        placeholder="Address title (e.g. Home)"
                        value={addressForm.address_title}
                        onChange={(e) => setAddressForm((f) => ({ ...f, address_title: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                      <input
                        required
                        placeholder="Address line 1"
                        value={addressForm.address_line1}
                        onChange={(e) => setAddressForm((f) => ({ ...f, address_line1: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                      <div className="flex gap-2">
                        <input
                          required
                          placeholder="City"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                        <input
                          placeholder="State"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          placeholder="Pincode"
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm((f) => ({ ...f, pincode: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                        <input
                          placeholder="Phone"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
                        >
                          {savingAddress ? 'Saving...' : 'Save Address'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <TrustBadges />
                </div>
              </div>

              {/* Right: Order Summary */}
              <div className="h-fit rounded-2xl border border-slate-100 p-6 shadow-sm lg:sticky lg:top-24">
                <div className="flex items-center gap-2.5">
                  <StepBadge step={2} />
                  <h2 className="font-semibold text-slate-900">Order Summary</h2>
                </div>

                <div className="mt-4 space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.item_code} className="flex items-start gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {item.website_image && (
                          <img
                            src={item.website_image}
                            alt={item.web_item_name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{item.web_item_name}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            onClick={() => setQty(item.item_code, item.qty - 1)}
                            aria-label="Decrease quantity"
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50"
                          >
                            <Minus className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                          </button>
                          <span className="w-5 text-center text-sm">{item.qty}</span>
                          <button
                            onClick={() => setQty(item.item_code, item.qty + 1)}
                            aria-label="Increase quantity"
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50"
                          >
                            <Plus className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-medium text-slate-900">{formatCurrency(item.amount)}</p>
                        <button
                          onClick={() => setQty(item.item_code, 0)}
                          aria-label={`Remove ${item.web_item_name} from cart`}
                          className="text-slate-300 transition-colors hover:text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/products"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> Add more items
                </Link>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setNotesOpen((v) => !v)}
                    className="flex w-full items-center justify-between text-sm font-medium text-slate-900"
                  >
                    Special Instructions
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${notesOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  {notesOpen && (
                    <div className="mt-2">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Ring the bell twice, leave at the door..."
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="mt-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                      >
                        {savingNotes ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                    <Tag className="h-4 w-4 text-slate-400" strokeWidth={2} aria-hidden />
                    Offers & Benefits
                  </p>
                  {cart.couponCode ? (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                      <span className="text-emerald-700">Applied: {cart.couponCode}</span>
                      <button onClick={handleRemoveCoupon} className="text-slate-500 underline">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="mt-2 flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Enter code"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                      <button
                        type="submit"
                        disabled={applyingCoupon || !couponInput}
                        className="shrink-0 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 disabled:opacity-50"
                      >
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </form>
                  )}
                  {couponError && <p className="mt-1 text-xs text-red-600">{couponError}</p>}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setBillDetailsOpen((v) => !v)}
                    className="flex w-full items-center justify-between text-sm font-medium text-slate-900"
                  >
                    <span>
                      Bill Details <span className="font-normal text-slate-400">(incl. taxes)</span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${billDetailsOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  {billDetailsOpen && (
                    <>
                      <div className="mt-2 space-y-1.5 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Net Total</span>
                          <span>{formatCurrency(cart.netTotal)}</span>
                        </div>
                        {cart.taxTotal > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span className="flex items-center gap-1">
                              Delivery Charge
                              <IconTooltip label="Based on your selected delivery zone">
                                <span tabIndex={0} className="text-slate-300 hover:text-slate-400">
                                  <Info className="h-3.5 w-3.5" strokeWidth={2} aria-label="Delivery charge info" />
                                </span>
                              </IconTooltip>
                            </span>
                            <span>{formatCurrency(cart.taxTotal)}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 font-semibold text-emerald-800">
                        <span>Grand Total</span>
                        <span>{formatCurrency(cart.grandTotal)}</span>
                      </div>
                    </>
                  )}
                </div>

                {checkoutError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600">
                    {checkoutError}
                  </p>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Lock className="h-4 w-4" strokeWidth={2} aria-hidden />
                  {checkingOut ? 'Placing order...' : 'Proceed to Checkout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
