import { ShieldCheck, Clock, Leaf, Heart, type LucideIcon } from 'lucide-react'

const BADGES: { Icon: LucideIcon; title: string; subtitle: string; ring: string }[] = [
  { Icon: ShieldCheck, title: 'Secure Checkout', subtitle: '100% Safe & Secure', ring: 'bg-emerald-50 text-emerald-700' },
  { Icon: Clock, title: 'On-time Delivery', subtitle: 'Right on your special day', ring: 'bg-rose-50 text-rose-600' },
  { Icon: Leaf, title: 'Fresh & Handpicked', subtitle: 'Sourced with care', ring: 'bg-emerald-50 text-emerald-700' },
  { Icon: Heart, title: 'Customer Support', subtitle: "We're here to help", ring: 'bg-rose-50 text-rose-600' },
]

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {BADGES.map(({ Icon, title, subtitle, ring }) => (
        <div key={title} className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ring}`}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          </span>
          <div className="text-xs leading-tight">
            <p className="font-semibold text-slate-800">{title}</p>
            <p className="text-slate-400">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
