import { User } from 'lucide-react'
import { getSessionUser, isLoggedIn } from '../../lib/auth'
import IconTooltip from '../Tooltip'

export default function ProfileButton() {
  const label = isLoggedIn() ? getSessionUser() : 'Guest'

  return (
    <IconTooltip label={label}>
      <button
        type="button"
        aria-label="Account"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all hover:scale-105 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <User className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </button>
    </IconTooltip>
  )
}
