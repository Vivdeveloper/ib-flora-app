import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, User } from 'lucide-react'
import Header from '../components/Header'
import Breadcrumb from '../components/cart/Breadcrumb'
import { useCart } from '../lib/CartContext'
import { getMyProfile, type UserProfile } from '../lib/account'
import { getShippingAddresses, type AddressOption } from '../lib/cart'

export default function Account() {
  const { loggedIn } = useCart()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<AddressOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false)
      return
    }
    Promise.all([getMyProfile(), getShippingAddresses()])
      .then(([myProfile, myAddresses]) => {
        setProfile(myProfile)
        setAddresses(myAddresses)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loggedIn])

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />
      <main className="mx-auto w-full max-w-[1920px] px-6 py-8 lg:px-10">
        <Breadcrumb current="Account" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Account</h1>
        <p className="mt-1 text-slate-500">Your profile and saved addresses.</p>

        {!loggedIn && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="font-medium text-amber-900">You need to be logged in to see your account.</p>
            <p className="mt-1 text-sm text-amber-800">
              <Link to="/login?redirect=/account" className="underline">
                Log in or create an account
              </Link>{' '}
              to continue.
            </p>
          </div>
        )}

        {loggedIn && loading && <p className="mt-8 text-slate-500">Loading account...</p>}

        {loggedIn && !loading && (
          <div className="mt-6 space-y-8">
            <section className="rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <User className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <h2 className="font-semibold text-slate-900">{profile?.full_name || 'Your profile'}</h2>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {profile?.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden /> {profile.email}
                  </p>
                )}
                {(profile?.mobile_no || profile?.phone) && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden />{' '}
                    {profile?.mobile_no || profile?.phone}
                  </p>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-900">Address Book</h2>
              {addresses.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No saved addresses yet — add one at checkout.</p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {addresses.map((addr) => (
                    <div
                      key={addr.name}
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4 shadow-sm"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <MapPin className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{addr.title}</p>
                        <div className="mt-0.5 text-sm text-slate-500">
                          {addr.display.split(/<br\s*\/?>/i).map((line, i) =>
                            line.trim() ? <p key={i}>{line.trim()}</p> : null,
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
