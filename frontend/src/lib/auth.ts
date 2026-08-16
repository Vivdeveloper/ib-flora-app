import { api } from './api'

// All auth here goes straight through core Frappe whitelisted methods (the
// same ones Desk's own /login and /update-password pages use) -- nothing
// about sessions, passwords, or verification is reimplemented.

// frappe.auth.LoginManager special-cases POST /api/method/login itself
// (see frappe/auth.py) rather than routing through the normal whitelisted
// dispatcher, so a bad usr/pwd raises frappe.AuthenticationError there and
// this rejects like any other failed request -- the caller should render
// the error via extractErrorMessage(). On success it sets the sid/user_id
// cookies on the response; there is no session state to read from the body.
export async function login(usr: string, pwd: string): Promise<void> {
  await api.post('/method/login', { usr, pwd })
}

export interface SignupResult {
  // 0 = already registered, 1 = verification email sent, 2 = no email
  // configured, needs manual admin verification. Mirrors
  // frappe.core.doctype.user.user.sign_up's own return contract.
  status: number
  message: string
}

// Creates a disabled-until-verified Website User and emails a password-set
// link (core's own /update-password page handles that link -- not
// reimplemented here). Does not log the new user in.
export async function signup(email: string, fullName: string, redirectTo = '/'): Promise<SignupResult> {
  const { data } = await api.post('/method/frappe.core.doctype.user.user.sign_up', {
    email,
    full_name: fullName,
    redirect_to: redirectTo,
  })
  const [status, message] = data.message as [number, string]
  return { status, message }
}

// Emails a reset link (same core /update-password destination as sign_up's
// verification link) for an existing user who forgot their password.
export async function requestPasswordReset(user: string): Promise<void> {
  await api.post('/method/frappe.core.doctype.user.user.reset_password', { user })
}

// Frappe sets a plain (non-HttpOnly) "user_id" cookie on every response --
// "Guest" for anonymous sessions, the username otherwise. Reading it avoids
// an extra API round-trip just to check login state.
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getSessionUser(): string {
  return readCookie('user_id') || 'Guest'
}

export function isLoggedIn(): boolean {
  return getSessionUser() !== 'Guest'
}

// Standard Frappe session logout (frappe.handler.logout, allow_guest so it
// never 403s even if the cookie's already stale). A full page reload after
// -- rather than just clearing React state -- is deliberate: isLoggedIn()
// and every API call here read the session straight off cookies, so a
// reload is the simplest way to guarantee nothing in the SPA still thinks
// it's authenticated.
export async function logout(): Promise<void> {
  await api.post('/method/logout')
  window.location.href = '/'
}
