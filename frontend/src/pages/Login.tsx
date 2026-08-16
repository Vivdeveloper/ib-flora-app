import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LogIn, UserPlus, Mail, Lock, User as UserIcon } from 'lucide-react'
import Header from '../components/Header'
import Breadcrumb from '../components/cart/Breadcrumb'
import { login, signup, requestPasswordReset } from '../lib/auth'
import { extractErrorMessage } from '../lib/cart'

type Tab = 'login' | 'signup'

const TABS: { id: Tab; label: string; Icon: typeof LogIn }[] = [
  { id: 'login', label: 'Log In', Icon: LogIn },
  { id: 'signup', label: 'Create Account', Icon: UserPlus },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100'

export default function Login() {
  const [tab, setTab] = useState<Tab>('login')
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/account'

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />
      <main className="mx-auto w-full max-w-md px-6 py-10">
        <Breadcrumb current="Login" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Welcome to IB Flora</h1>
        <p className="mt-1 text-slate-500">Log in or create an account to check out and track your orders.</p>

        <div className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 p-6 shadow-sm">
          {tab === 'login' ? (
            <LoginForm onLoggedIn={() => (window.location.href = redirectTo)} />
          ) : (
            <SignupForm redirectTo={redirectTo} onDone={() => setTab('login')} />
          )}
        </div>

        {tab === 'signup' && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button type="button" onClick={() => setTab('login')} className="text-emerald-700 underline">
              Log in
            </button>
          </p>
        )}
      </main>
    </div>
  )
}

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [usr, setUsr] = useState('')
  const [pwd, setPwd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(usr, pwd)
      onLoggedIn()
    } catch (err) {
      setError(extractErrorMessage(err))
      setSubmitting(false)
    }
  }

  if (forgotOpen) return <ForgotPasswordForm onBack={() => setForgotOpen(false)} initialEmail={usr} />

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="usr" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="usr"
            type="email"
            required
            autoComplete="username"
            value={usr}
            onChange={(e) => setUsr(e.target.value)}
            placeholder="you@example.com"
            className={`${INPUT_CLASS} pl-9`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="pwd" className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="pwd"
            type="password"
            required
            autoComplete="current-password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="••••••••"
            className={`${INPUT_CLASS} pl-9`}
          />
        </div>
      </div>

      <div className="text-right">
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="text-sm text-emerald-700 underline"
        >
          Forgot password?
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {submitting ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  )
}

function SignupForm({ redirectTo, onDone }: { redirectTo: string; onDone: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { status, message } = await signup(email, fullName, redirectTo)
      if (status === 0) {
        setError(message)
      } else {
        setResult(message)
      }
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="text-center">
        <p className="font-medium text-slate-900">{result}</p>
        <button type="button" onClick={onDone} className="mt-4 text-sm text-emerald-700 underline">
          Back to Log In
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-slate-700">
          Full Name
        </label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="full_name"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className={`${INPUT_CLASS} pl-9`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="signup_email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="signup_email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${INPUT_CLASS} pl-9`}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {submitting ? 'Creating account...' : 'Create Account'}
      </button>
      <p className="text-center text-xs text-slate-400">
        We'll email you a link to set your password and get started.
      </p>
    </form>
  )
}

function ForgotPasswordForm({ onBack, initialEmail }: { onBack: () => void; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="font-medium text-slate-900">If that account exists, a reset link is on its way.</p>
        <button type="button" onClick={onBack} className="mt-4 text-sm text-emerald-700 underline">
          Back to Log In
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="reset_email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            id="reset_email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${INPUT_CLASS} pl-9`}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Send Reset Link'}
      </button>
      <button type="button" onClick={onBack} className="w-full text-center text-sm text-slate-500 underline">
        Back to Log In
      </button>
    </form>
  )
}
