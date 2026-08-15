import { Link, useLocation } from 'react-router-dom'
import { Calendar, ShoppingBag, Truck, type LucideIcon } from 'lucide-react'

interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
  ring: string
  activeRing: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/products',
    label: 'Products',
    Icon: ShoppingBag,
    ring: 'bg-emerald-50 text-emerald-700',
    activeRing: 'bg-emerald-100 text-emerald-800',
  },
  {
    to: '/subscriptions',
    label: 'Subscriptions',
    Icon: Calendar,
    ring: 'bg-rose-50 text-rose-600',
    activeRing: 'bg-rose-100 text-rose-700',
  },
  {
    to: '/deliveries',
    label: 'Deliveries',
    Icon: Truck,
    ring: 'bg-amber-50 text-amber-600',
    activeRing: 'bg-amber-100 text-amber-700',
  },
]

export default function MainNavigation() {
  const { pathname } = useLocation()

  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {NAV_ITEMS.map(({ to, label, Icon, ring, activeRing }) => {
        const active = pathname.startsWith(to)
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className="group flex flex-col items-center gap-1 rounded-xl px-2 py-1 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${active ? activeRing : ring}`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </span>
            <span className={`text-xs font-medium ${active ? 'text-slate-900' : 'text-slate-600'}`}>
              {label}
            </span>
            <span
              aria-hidden
              className={`h-0.5 w-4 rounded-full transition-colors ${active ? 'bg-emerald-600' : 'bg-transparent'}`}
            />
          </Link>
        )
      })}
    </nav>
  )
}
