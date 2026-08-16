// In dev, this SPA runs on Vite's own dev server (see vite.config.ts) which
// only proxies /api and /files to the Frappe backend. A plain relative link
// like /app or /app/login resolves against the dev server's own origin
// instead, hits React Router with no matching route, and renders blank.
//
// In a production build this frontend is served by the Frappe site itself,
// so /app is already same-origin there and this is a no-op. 8002 is this
// bench's fixed dev port -- the same one vite.config.ts's own proxy target
// already assumes.
const DEV_BACKEND_ORIGIN = `${window.location.protocol}//${window.location.hostname}:8002`

export function backendUrl(path: string): string {
  return import.meta.env.DEV ? `${DEV_BACKEND_ORIGIN}${path}` : path
}
