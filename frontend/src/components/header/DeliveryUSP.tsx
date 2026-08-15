import { Truck } from 'lucide-react'

export default function DeliveryUSP() {
  return (
    <div className="hidden items-center gap-2.5 lg:flex">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Truck className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <div className="text-xs leading-tight">
        <p className="font-semibold text-slate-700">Fresh & On-time</p>
        <p className="text-slate-400">Delivery</p>
      </div>
    </div>
  )
}
