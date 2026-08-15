import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getCart, updateCartItem, type Cart } from './cart'
import { isLoggedIn } from './auth'

interface CartContextValue {
  cart: Cart
  loading: boolean
  loggedIn: boolean
  refresh: () => Promise<void>
  setQty: (itemCode: string, qty: number) => Promise<void>
  addToCart: (itemCode: string, qty?: number) => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

const EMPTY_CART: Cart = {
  items: [],
  totalQty: 0,
  netTotal: 0,
  taxTotal: 0,
  grandTotal: 0,
  partyDoctype: null,
  partyName: null,
  shippingAddressName: null,
  couponCode: null,
  additionalNotes: '',
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setCart(await getCart())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function setQty(itemCode: string, qty: number) {
    if (!isLoggedIn()) return
    const existing = cart.items.find((i) => i.item_code === itemCode)
    // Optimistic update so the UI feels instant; refresh() reconciles after.
    setCart((prev) => ({
      ...prev,
      items:
        qty <= 0
          ? prev.items.filter((i) => i.item_code !== itemCode)
          : existing
            ? prev.items.map((i) => (i.item_code === itemCode ? { ...i, qty } : i))
            : prev.items,
    }))
    try {
      await updateCartItem(itemCode, qty)
    } catch {
      // e.g. session expired mid-use -- reconcile with the server below
    }
    await refresh()
  }

  async function addToCart(itemCode: string, qty = 1) {
    if (!isLoggedIn()) return
    const existing = cart.items.find((i) => i.item_code === itemCode)
    try {
      await updateCartItem(itemCode, (existing?.qty ?? 0) + qty)
    } catch {
      // e.g. session expired mid-use -- reconcile with the server below
    }
    await refresh()
  }

  return (
    <CartContext.Provider
      value={{ cart, loading, loggedIn: isLoggedIn(), refresh, setQty, addToCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
