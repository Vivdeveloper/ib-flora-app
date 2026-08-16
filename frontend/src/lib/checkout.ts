import { api } from './api'

// ---- Razorpay checkout params (ib_flora.api.create_payment_request) ----
//
// Wraps the standard Payment Request -> Razorpay flow (erpnext's
// make_payment_request + Payments app's RazorpaySettings), repackaged as
// JSON instead of a redirect -- see ib_flora/api.py:create_payment_request.

export interface RazorpayCheckoutParams {
  payment_request: string
  token: string
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description: string
  reference_doctype: string
  reference_docname: string
  prefill: { name?: string; email?: string }
}

export async function createPaymentRequest(salesOrder: string): Promise<RazorpayCheckoutParams> {
  const { data } = await api.post('/method/ib_flora.api.create_payment_request', {
    sales_order: salesOrder,
  })
  return data.message
}

// ---- Payment confirmation (standard Payments app callback) ----
//
// Same endpoint Frappe's own razorpay_checkout.js calls after the modal's
// handler fires: it fetches the payment's authoritative status from
// Razorpay's API server-side, then runs webshop's on_payment_authorized
// (Payment Request -> Payment Entry against the Sales Order).
// See payments/templates/pages/razorpay_checkout.py:make_payment.

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export async function confirmRazorpayPayment(
  params: RazorpayCheckoutParams,
  response: RazorpaySuccessResponse,
): Promise<{ status: number; redirect_to?: string }> {
  const { data } = await api.post('/method/payments.templates.pages.razorpay_checkout.make_payment', {
    razorpay_payment_id: response.razorpay_payment_id,
    options: JSON.stringify({
      key: params.key,
      amount: params.amount,
      currency: params.currency,
      name: params.name,
      description: params.description,
      order_id: params.order_id,
      prefill: params.prefill,
    }),
    reference_doctype: params.reference_doctype,
    reference_docname: params.reference_docname,
    token: params.token,
  })
  return data.message
}

// ---- Server-side payment status (standard frappe.client reads) ----
//
// Deliberately not trusting that Razorpay's success callback firing in the
// browser means payment actually landed -- confirms it by reading the
// Sales Order and any submitted Payment Entry referencing it, both via
// Frappe's own generic, already-whitelisted client API (no custom endpoint
// needed for this part).

export interface OrderPaymentStatus {
  salesOrder: {
    name: string
    status: string
    grand_total: number
    advance_paid: number
    currency: string
  } | null
  paymentEntries: {
    name: string
    paid_amount: number
    posting_date: string
    status: string
  }[]
}

export async function getOrderPaymentStatus(salesOrder: string): Promise<OrderPaymentStatus> {
  const [soRes, peRes] = await Promise.all([
    api.get('/method/frappe.client.get_value', {
      params: {
        doctype: 'Sales Order',
        filters: JSON.stringify({ name: salesOrder }),
        fieldname: JSON.stringify(['name', 'status', 'grand_total', 'advance_paid', 'currency']),
      },
    }),
    api.get('/method/frappe.client.get_list', {
      params: {
        doctype: 'Payment Entry',
        filters: JSON.stringify([
          ['Payment Entry Reference', 'reference_doctype', '=', 'Sales Order'],
          ['Payment Entry Reference', 'reference_name', '=', salesOrder],
          ['Payment Entry', 'docstatus', '=', 1],
        ]),
        fields: JSON.stringify(['name', 'paid_amount', 'posting_date', 'status']),
      },
    }),
  ])

  return {
    salesOrder: soRes.data.message ?? null,
    paymentEntries: peRes.data.message ?? [],
  }
}
