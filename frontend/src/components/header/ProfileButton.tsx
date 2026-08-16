import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { User, Truck, Receipt, LifeBuoy, LayoutDashboard, LogOut, LogIn } from 'lucide-react'
import { getSessionUser, isLoggedIn, logout } from '../../lib/auth'
import { backendUrl } from '../../lib/backend'

const MENU_ITEMS = [
  { to: '/deliveries', label: 'Delivery History', Icon: Truck },
  { to: '/transactions', label: 'Transactions and Invoices', Icon: Receipt },
  { to: '/account', label: 'Account', Icon: User },
  { to: '/support', label: 'Support', Icon: LifeBuoy },
]

export default function ProfileButton() {
  const [open, setOpen] = useState(false)
  const loggedIn = isLoggedIn()
  const label = loggedIn ? getSessionUser() : 'Guest'

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Account"
          title={label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all hover:scale-105 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <User className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          aria-label="Account menu"
          className="z-50 w-64 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-lg"
        >
          <div className="truncate px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            {label}
          </div>

          {!loggedIn && (
            <>
              <DropdownMenu.Item asChild>
                <Link
                  to="/login"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-700 outline-none transition-colors focus:bg-emerald-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <LogIn className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  Log In / Sign Up
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1.5 h-px bg-slate-100" />
            </>
          )}

          {MENU_ITEMS.map(({ to, label: itemLabel, Icon }) => (
            <DropdownMenu.Item key={to} asChild>
              <Link
                to={to}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none transition-colors focus:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                {itemLabel}
              </Link>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1.5 h-px bg-slate-100" />

          {/* Everyone gets this for now -- restricting it to the
              Administrator role is planned but not wired up yet. */}
          <DropdownMenu.Item asChild>
            <a
              href={backendUrl('/app')}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none transition-colors focus:bg-slate-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <LayoutDashboard className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              Desk
            </a>
          </DropdownMenu.Item>

          {loggedIn && (
            <>
              <DropdownMenu.Separator className="my-1.5 h-px bg-slate-100" />
              <DropdownMenu.Item
                onSelect={() => {
                  logout()
                }}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-600 outline-none transition-colors focus:bg-rose-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                  <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                Logout
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
