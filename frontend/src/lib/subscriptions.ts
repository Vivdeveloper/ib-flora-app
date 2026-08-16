import { api } from './api'

// ---- Plans (standard Subscription Plan doctype) ----

export interface SubscriptionPlan {
  name: string
  plan_name: string
  item: string
  cost: number
  currency: string
  billing_interval: string
}

// Subscription Plan has no Guest/Customer read permission by default, so
// this goes through ib_flora.api.list_subscription_plans rather than a
// generic frappe.client.get_list call.
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await api.get('/method/ib_flora.api.list_subscription_plans')
  return data.message ?? []
}

// ---- My subscriptions (standard Subscription doctype) ----

export interface MySubscription {
  name: string
  status: string
  delivery_zone: string | null
  is_paused: 0 | 1
  pause_from: string | null
  pause_to: string | null
  start_date: string
  plan_name: string | null
  item: string | null
  // Subscription's own current_invoice_end field -- see
  // ib_flora.api.list_my_subscriptions' docstring for why it's surfaced
  // under this name instead.
  next_invoice_date: string | null
}

export async function getMySubscriptions(): Promise<MySubscription[]> {
  const { data } = await api.get('/method/ib_flora.api.list_my_subscriptions')
  return data.message ?? []
}

export async function createSubscription(
  item: string,
  plan: string,
  deliveryZone: string,
  startDate: string,
): Promise<{ name: string; status: string; delivery_zone: string }> {
  const { data } = await api.post('/method/ib_flora.api.create_subscription', {
    item,
    plan,
    delivery_zone: deliveryZone,
    start_date: startDate,
  })
  return data.message
}

export async function pauseSubscription(
  name: string,
  pauseFrom: string,
  pauseTo: string,
): Promise<{ name: string; is_paused: 0 | 1; pause_from: string; pause_to: string }> {
  const { data } = await api.post('/method/ib_flora.api.pause_subscription', {
    name,
    pause_from: pauseFrom,
    pause_to: pauseTo,
  })
  return data.message
}

export async function resumeSubscription(name: string): Promise<{ name: string; is_paused: 0 | 1 }> {
  const { data } = await api.post('/method/ib_flora.api.resume_subscription', { name })
  return data.message
}

// ---- Subscription billing invoices (standard Sales Invoice doctype) ----
//
// A Subscription's billing cycle creates these automatically -- this is
// what a customer actually pays against, via the same Razorpay flow Cart
// checkout already uses (see lib/checkout.ts's createPaymentRequest).

export interface MySubscriptionInvoice {
  name: string
  subscription: string
  status: string
  grand_total: number
  outstanding_amount: number
  currency: string
  posting_date: string
  due_date: string | null
}

export async function getMySubscriptionInvoices(): Promise<MySubscriptionInvoice[]> {
  const { data } = await api.get('/method/ib_flora.api.list_my_subscription_invoices')
  return data.message ?? []
}
