import { useEffect, useState } from 'react'
import { Mail, Phone, LifeBuoy } from 'lucide-react'
import Header from '../components/Header'
import Breadcrumb from '../components/cart/Breadcrumb'
import { getSupportContact, type SupportContact } from '../lib/account'

export default function Support() {
  const [contact, setContact] = useState<SupportContact | null>(null)

  useEffect(() => {
    getSupportContact()
      .then(setContact)
      .catch(() => setContact({ email: null, phone: null }))
  }, [])

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />
      <main className="mx-auto w-full max-w-md px-6 py-16 text-center">
        <div className="mb-8 text-left">
          <Breadcrumb current="Support" />
        </div>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <LifeBuoy className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Need help?</h1>
        <p className="mt-2 text-sm text-slate-500">We're here for anything about your order or delivery.</p>

        {contact && (contact.email || contact.phone) ? (
          <div className="mt-6 space-y-3">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <Mail className="h-4 w-4" strokeWidth={2} aria-hidden /> {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <Phone className="h-4 w-4" strokeWidth={2} aria-hidden /> {contact.phone}
              </a>
            )}
          </div>
        ) : (
          contact && (
            <p className="mt-6 text-sm text-slate-400">
              No support contact is configured yet — add an email or phone number to the Company record in
              Desk to show it here.
            </p>
          )
        )}
      </main>
    </div>
  )
}
