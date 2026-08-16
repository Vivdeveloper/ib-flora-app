import { Leaf, ShieldCheck, Truck, type LucideIcon } from 'lucide-react'

interface Badge {
  Icon: LucideIcon
  label: string
  subtitle: string
  ring: string
}

const BADGES: Badge[] = [
  { Icon: Leaf, label: '100% Fresh', subtitle: 'Handpicked Daily', ring: 'bg-emerald-100 text-emerald-700' },
  { Icon: ShieldCheck, label: 'Premium Quality', subtitle: 'Carefully Selected', ring: 'bg-violet-100 text-violet-700' },
  { Icon: Truck, label: 'Fast Delivery', subtitle: 'On-time, Always', ring: 'bg-rose-100 text-rose-600' },
]

export default function FeatureBadges({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`}>
      {BADGES.map(({ Icon, label, subtitle, ring }) => (
        <div
          key={label}
          className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white/90 px-3.5 py-2 shadow-sm"
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ring}`}>
            <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
