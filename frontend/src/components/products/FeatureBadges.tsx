import { Leaf, ShieldCheck, Truck, type LucideIcon } from 'lucide-react'

interface Badge {
  Icon: LucideIcon
  label: string
  ring: string
}

const BADGES: Badge[] = [
  { Icon: Leaf, label: '100% Fresh', ring: 'bg-emerald-100 text-emerald-700' },
  { Icon: ShieldCheck, label: 'Premium Quality', ring: 'bg-violet-100 text-violet-700' },
  { Icon: Truck, label: 'Fast Delivery', ring: 'bg-rose-100 text-rose-600' },
]

export default function FeatureBadges({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`}>
      {BADGES.map(({ Icon, label, ring }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-4 text-sm font-medium text-slate-700 shadow-sm"
        >
          <span className={`flex h-7 w-7 items-center justify-center rounded-full ${ring}`}>
            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
          </span>
          {label}
        </div>
      ))}
    </div>
  )
}
