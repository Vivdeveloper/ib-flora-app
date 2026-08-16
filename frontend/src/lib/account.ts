import { api } from './api'
import { getSessionUser } from './auth'

// ---- Profile (standard User doctype) ----

export interface UserProfile {
  full_name: string | null
  email: string | null
  phone: string | null
  mobile_no: string | null
}

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await api.get('/method/frappe.client.get_value', {
    params: {
      doctype: 'User',
      filters: JSON.stringify({ name: getSessionUser() }),
      fieldname: JSON.stringify(['full_name', 'email', 'phone', 'mobile_no']),
    },
  })
  return data.message
}

// ---- Orders (standard Sales Order, same doctype webshop's place_order()
// creates from the cart's Quotation) ----
//
// Filtered by `owner` -- a core Frappe framework field set automatically to
// whoever was logged in at insert time -- rather than a custom "belongs to
// this customer" field, since that's guaranteed correct regardless of how
// webshop maps party/contact fields on the resulting Sales Order.

export interface MyOrder {
  name: string
  transaction_date: string
  delivery_date: string | null
  status: string
  grand_total: number
  currency: string
}

export async function getMyOrders(): Promise<MyOrder[]> {
  const { data } = await api.get('/method/frappe.client.get_list', {
    params: {
      doctype: 'Sales Order',
      filters: JSON.stringify([['owner', '=', getSessionUser()]]),
      fields: JSON.stringify([
        'name',
        'transaction_date',
        'delivery_date',
        'status',
        'grand_total',
        'currency',
      ]),
      order_by: 'creation desc',
      limit_page_length: 0,
    },
  })
  return data.message ?? []
}

// ---- Payments (standard Payment Entry, via the same Payment Entry
// Reference child-table join lib/checkout.ts's getOrderPaymentStatus
// already uses for a single order) ----
//
// Joined off the caller's own order names rather than filtering Payment
// Entry by `owner` directly -- the entry that lands after a Razorpay
// confirmation is created by payments.templates.pages.razorpay_checkout's
// server-side handler, not guaranteed to run as the customer's own session
// user, so `owner` isn't a reliable filter here the way it is for orders.

export interface MyPayment {
  name: string
  reference_name: string
  paid_amount: number
  posting_date: string
  status: string
}

// `reference_name` lives on the Payment Entry Reference child table, not on
// Payment Entry itself, so it can't be pulled back through a single
// frappe.client.get_list field selection -- one query per order (same shape
// as getOrderPaymentStatus in lib/checkout.ts) and attach the order name
// client-side from the loop instead.
export async function getMyPayments(orderNames: string[]): Promise<MyPayment[]> {
  const perOrder = await Promise.all(
    orderNames.map(async (orderName) => {
      const { data } = await api.get('/method/frappe.client.get_list', {
        params: {
          doctype: 'Payment Entry',
          filters: JSON.stringify([
            ['Payment Entry Reference', 'reference_doctype', '=', 'Sales Order'],
            ['Payment Entry Reference', 'reference_name', '=', orderName],
            ['Payment Entry', 'docstatus', '=', 1],
          ]),
          fields: JSON.stringify(['name', 'paid_amount', 'posting_date', 'status']),
          order_by: 'creation desc',
        },
      })
      const rows = (data.message ?? []) as Omit<MyPayment, 'reference_name'>[]
      return rows.map((row) => ({ ...row, reference_name: orderName }))
    }),
  )
  return perOrder.flat().sort((a, b) => b.posting_date.localeCompare(a.posting_date))
}

// ---- Support contact (standard Company doctype -- whatever's actually
// configured in Desk, not fabricated placeholder contact details) ----

export interface SupportContact {
  email: string | null
  phone: string | null
}

export async function getSupportContact(): Promise<SupportContact> {
  const { data } = await api.get('/method/frappe.client.get_list', {
    params: {
      doctype: 'Company',
      fields: JSON.stringify(['email', 'phone_no']),
      limit_page_length: 1,
    },
  })
  const company = data.message?.[0]
  return { email: company?.email ?? null, phone: company?.phone_no ?? null }
}
