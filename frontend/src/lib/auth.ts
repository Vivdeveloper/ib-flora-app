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
