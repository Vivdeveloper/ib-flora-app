import { Flower2, MapPin } from 'lucide-react'
import type { FormEvent } from 'react'
import type { DeliveryZoneCheck } from '../../lib/api'
import { formatTime } from '../../lib/format'

interface DeliveryInfoProps {
  checking: boolean
  zone: DeliveryZoneCheck | null
  pincode: string
  editing: boolean
  onPincodeChange: (value: string) => void
  onStartEdit: () => void
  onSubmit: (e: FormEvent) => void
}

export default function DeliveryInfo({
  checking,
  zone,
  pincode,
  editing,
  onPincodeChange,
  onStartEdit,
  onSubmit,
}: DeliveryInfoProps) {
  return (
    <div className="hidden min-w-[210px] items-center gap-3 text-sm md:flex">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500">
        <Flower2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>

      <div>
        {checking && <p className="text-slate-400">Checking delivery...</p>}

        {!checking && zone?.zone_found && (
          <>
            <p className="font-semibold text-emerald-700">
              Delivery {zone.same_day_eligible ? 'today' : 'tomorrow'} by{' '}
              {formatTime(zone.delivery_end)}
            </p>
            <p className="text-slate-400">
              Order by {formatTime(zone.cutoff_time)}
              {zone.same_day_eligible ? ' today' : ' tomorrow'} for this slot
            </p>
          </>
        )}

        {!checking && zone && !zone.zone_found && (
          <p className="text-slate-500">We don't deliver to {pincode} yet.</p>
        )}

        {editing ? (
          <form onSubmit={onSubmit} className="mt-1 flex gap-1">
            <input
              autoFocus
              value={pincode}
              onChange={(e) => onPincodeChange(e.target.value)}
              className="w-28 rounded border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Pincode"
              aria-label="Enter pincode"
            />
            <button
              type="submit"
              className="rounded bg-slate-900 px-2 py-1 text-sm text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Check
            </button>
          </form>
        ) : (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            <span className="font-medium text-slate-600">{zone?.territory ?? pincode}</span>
            <button
              type="button"
              onClick={onStartEdit}
              className="rounded font-semibold text-rose-600 transition-colors hover:text-rose-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
            >
              Change
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
