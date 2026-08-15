import { Link } from 'react-router-dom'

export default function BrandSection() {
  return (
    <Link
      to="/"
      aria-label="IB Flora home"
      className="relative flex items-center gap-2.5 rounded-xl py-1 pl-5 pr-2 transition-colors hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
    >
      <img
        src="/branding/ib-flora-logo.png"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute -left-3 -top-4 h-20 w-20 select-none object-contain"
      />
      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold tracking-tight text-white">
        IB
      </span>
      <span className="relative z-10">
        <span className="block text-lg font-bold leading-tight tracking-tight text-slate-900">
          IB <span className="text-emerald-700">Flora</span>
        </span>
        <span className="block text-xs leading-tight text-slate-400">
          Fresh Flowers, Delivered Daily
        </span>
      </span>
    </Link>
  )
}
