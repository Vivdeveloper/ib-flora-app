import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../../lib/CartContext'
import IconTooltip from '../Tooltip'

export default function CartButton() {
  const { cart } = useCart()

  return (
    <IconTooltip label={cart.totalQty > 0 ? `Cart (${cart.totalQty})` : 'Cart'}>
      <Link
        to="/cart"
        aria-label={cart.totalQty > 0 ? `View cart, ${cart.totalQty} items` : 'View cart'}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all hover:scale-105 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        {cart.totalQty > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-medium text-white">
            {cart.totalQty}
          </span>
        )}
      </Link>
    </IconTooltip>
  )
}
