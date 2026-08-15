// Formats a "HH:MM:SS" time string (as returned by Frappe's Time fieldtype)
// into a friendly "h:mm AM/PM" string.
export function formatTime(time?: string): string {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  const h = Number(hStr)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mStr} ${period}`
}

// Indian-grouped rupee amount (e.g. 12345 -> "₹12,345"). Quotation amounts
// are whole-rupee in this app's seed data, but this tolerates paise too.
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}
