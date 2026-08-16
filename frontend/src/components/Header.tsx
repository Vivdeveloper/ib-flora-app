import { useEffect, useState, type FormEvent } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { checkDeliveryZone, type DeliveryZoneCheck } from '../lib/api'
import BrandSection from './header/BrandSection'
import DeliveryInfo from './header/DeliveryInfo'
import DeliveryUSP from './header/DeliveryUSP'
import MainNavigation from './header/MainNavigation'
import MobileNavMenu from './header/MobileNavMenu'
import CartButton from './header/CartButton'
import ProfileButton from './header/ProfileButton'

// Pincode we default-check on load, purely so the header has something to
// show out of the box -- this is the one zone seeded so far (Wakad).
const DEFAULT_PINCODE = '411057'

export default function Header() {
  const [pincode, setPincode] = useState(DEFAULT_PINCODE)
  const [editing, setEditing] = useState(false)
  const [zone, setZone] = useState<DeliveryZoneCheck | null>(null)
  const [checking, setChecking] = useState(true)

  async function runCheck(code: string) {
    setChecking(true)
    try {
      setZone(await checkDeliveryZone(code))
    } catch {
      setZone(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    runCheck(DEFAULT_PINCODE)
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setEditing(false)
    runCheck(pincode)
  }

  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={300}>
      <header className="sticky top-0 z-20 bg-gradient-to-b from-rose-50/70 to-transparent px-3 pb-2 pt-2 lg:px-6">
        <div className="relative mx-auto flex w-full max-w-[1920px] flex-wrap items-center justify-between gap-y-2 gap-x-3 rounded-2xl border border-rose-100 bg-white/95 px-4 py-2 shadow-sm sm:gap-x-4 sm:px-5 sm:py-2.5">
          <BrandSection />

          <DeliveryInfo
            checking={checking}
            zone={zone}
            pincode={pincode}
            editing={editing}
            onPincodeChange={setPincode}
            onStartEdit={() => setEditing(true)}
            onSubmit={handleSubmit}
          />

          <div className="hidden h-9 w-px bg-slate-200 lg:block" />

          <DeliveryUSP />

          <div className="flex items-center gap-2 sm:gap-3">
            <MainNavigation />
            <MobileNavMenu />
            <CartButton />
            <ProfileButton />
          </div>
        </div>
      </header>
    </Tooltip.Provider>
  )
}
