import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Menu, X } from 'lucide-react'
import { NAV_ITEMS } from './MainNavigation'

export default function MobileNavMenu() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 lg:hidden"
        >
          {open ? <X className="h-[18px] w-[18px]" aria-hidden /> : <Menu className="h-[18px] w-[18px]" aria-hidden />}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          aria-label="Navigation menu"
          className="z-50 w-56 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-lg"
        >
          {NAV_ITEMS.map(({ to, label, Icon, ring }) => {
            const active = pathname.startsWith(to)
            return (
              <DropdownMenu.Item key={to} asChild>
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus:bg-slate-50 ${
                    active ? 'font-semibold text-slate-900' : 'text-slate-600'
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ring}`}>
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  {label}
                </Link>
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
