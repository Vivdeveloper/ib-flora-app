import { api } from './api'
import { isLoggedIn } from './auth'

export interface CartItem {
  item_code: string
  qty: number
  rate: number
  amount: number
  web_item_name: string
  website_image: string | null
  route: string | null
  stock_uom: string | null
}

export interface Cart {
  items: CartItem[]
  totalQty: number
  netTotal: number
  taxTotal: number
  grandTotal: number
  partyDoctype: string | null
  partyName: string | null
  shippingAddressName: string | null
  couponCode: string | null
  additionalNotes: string
}

const EMPTY_CART: Cart = {
  items: [],
  totalQty: 0,
  netTotal: 0,
  taxTotal: 0,
  grandTotal: 0,
  partyDoctype: null,
  partyName: null,
  shippingAddressName: null,
  couponCode: null,
  additionalNotes: '',
}

interface RawQuotationItem {
  item_code: string
  item_name: string
  qty: number
  rate: number
  amount: number
  additional_notes?: string
}

interface ItemDetail {
  item_code: string
  web_item_name: string
  website_image: string | null
  route: string | null
  stock_uom: string | null
}

// Backs the cart with webshop's own standard Shopping Cart Quotation
// (webshop.webshop.shopping_cart.cart) -- the same mechanism the stock
// webshop templates use. Requires a logged-in session; Webshop's cart
// mutation endpoints aren't guest-accessible. In this app that means
// whoever is logged in via Desk (/app) in the same browser -- there's no
// separate storefront login flow yet.
export async function getCart(): Promise<Cart> {
  if (!isLoggedIn()) return EMPTY_CART

  try {
    const { data } = await api.get('/method/webshop.webshop.shopping_cart.cart.get_cart_quotation')
    const doc = data.message?.doc
    if (!doc || !doc.items?.length) return EMPTY_CART

    const rawItems = doc.items as RawQuotationItem[]
    const details = await getItemDetails(rawItems.map((i) => i.item_code))

    const items: CartItem[] = rawItems.map((row) => {
      const detail = details[row.item_code]
      return {
        item_code: row.item_code,
        qty: row.qty,
        rate: row.rate,
        amount: row.amount,
        web_item_name: detail?.web_item_name ?? row.item_name,
        website_image: detail?.website_image ?? null,
        route: detail?.route ?? null,
        stock_uom: detail?.stock_uom ?? null,
      }
    })

    return {
      items,
      totalQty: doc.total_qty ?? 0,
      netTotal: doc.net_total ?? 0,
      taxTotal: doc.total_taxes_and_charges ?? 0,
      grandTotal: doc.grand_total ?? 0,
      partyDoctype: doc.quotation_to ?? null,
      partyName: doc.party_name ?? null,
      shippingAddressName: doc.shipping_address_name || null,
      couponCode: doc.coupon_code || null,
      additionalNotes: rawItems[0]?.additional_notes ?? '',
    }
  } catch {
    return EMPTY_CART
  }
}

export async function updateCartItem(itemCode: string, qty: number): Promise<void> {
  await api.post('/method/webshop.webshop.shopping_cart.cart.update_cart', {
    item_code: itemCode,
    qty,
  })
}

async function getItemDetails(itemCodes: string[]): Promise<Record<string, ItemDetail>> {
  const unique = Array.from(new Set(itemCodes))
  const { data } = await api.post('/method/ib_flora.api.get_item_details', {
    item_codes: unique,
  })
  return data.message
}

export { getItemDetails }

// ---- Delivery address (standard Address doctype, via webshop's cart address helpers) ----

export interface AddressOption {
  name: string
  title: string
  display: string
}

export async function getShippingAddresses(): Promise<AddressOption[]> {
  const { data } = await api.get('/method/webshop.webshop.shopping_cart.cart.get_shipping_addresses')
  return data.message ?? []
}

export interface NewAddressInput {
  address_title: string
  address_line1: string
  address_line2?: string
  city: string
  state?: string
  country: string
  pincode?: string
  phone?: string
}

// Address needs a Dynamic Link back to the cart's own party (Customer) to show
// up in get_shipping_addresses() afterwards -- partyDoctype/partyName come
// straight off the cart's Quotation (quotation_to/party_name).
export async function addShippingAddress(
  input: NewAddressInput,
  partyDoctype: string,
  partyName: string,
): Promise<AddressOption> {
  const { data } = await api.post('/method/webshop.webshop.shopping_cart.cart.add_new_address', {
    doc: {
      ...input,
      address_type: 'Shipping',
      links: [{ link_doctype: partyDoctype, link_name: partyName }],
    },
  })
  const address = data.message
  return { name: address.name, title: address.address_title, display: '' }
}

// The only Shipping Rule configured for this store today (see Task 2 of
// this project). webshop's own rule-matching helper
// (get_applicable_shipping_rules) isn't actually whitelisted for API use --
// it's an internal helper for the Jinja cart templates -- so with just one
// rule in the system, applying it directly is simpler than adding another
// custom endpoint to reimplement country-matching for a single row.
const SHIPPING_RULE = 'IB Flora Standard Delivery'

export async function selectShippingAddress(addressName: string): Promise<void> {
  await api.post('/method/webshop.webshop.shopping_cart.cart.update_cart_address', {
    address_type: 'shipping',
    address_name: addressName,
  })
  try {
    await api.post('/method/webshop.webshop.shopping_cart.cart.apply_shipping_rule', {
      shipping_rule: SHIPPING_RULE,
    })
  } catch {
    // e.g. rule disabled or doesn't cover this address's country -- leave as-is
  }
}

// ---- Coupon codes (standard Coupon Code / Pricing Rule validation) ----

export function extractErrorMessage(err: unknown): string {
  const messagesRaw = (err as { response?: { data?: { _server_messages?: string } } })?.response?.data
    ?._server_messages
  if (messagesRaw) {
    try {
      const messages = JSON.parse(messagesRaw) as string[]
      const first = JSON.parse(messages[0])
      if (first?.message) return first.message as string
    } catch {
      // fall through to generic message below
    }
  }
  return 'Something went wrong. Please try again.'
}

export async function applyCoupon(code: string): Promise<void> {
  await api.post('/method/webshop.webshop.shopping_cart.cart.apply_coupon_code', {
    applied_code: code,
    applied_referral_sales_partner: '',
  })
}

export async function removeCoupon(): Promise<void> {
  await api.post('/method/webshop.webshop.shopping_cart.cart.remove_coupon_code')
}

// ---- Special instructions (Quotation Item.additional_notes, cart-wide) ----

export async function setCartNotes(notes: string): Promise<void> {
  await api.post('/method/ib_flora.api.set_cart_notes', { notes })
}

// ---- Checkout (standard Webshop cart -> Sales Order conversion) ----

// webshop's own checkout endpoint: submits the cart Quotation and converts
// it into a submitted Sales Order (webshop.webshop.shopping_cart.cart.place_order).
// Returns the new Sales Order's name.
export async function placeOrder(): Promise<string> {
  const { data } = await api.post('/method/webshop.webshop.shopping_cart.cart.place_order')
  return data.message
}

// Addresses returned by getShippingAddresses() only carry a formatted
// display string, not a structured pincode -- fetch it straight off the
// standard Address doctype so checkout can re-validate the delivery zone
// for whichever address is actually selected (not a hardcoded default).
export async function getAddressPincode(addressName: string): Promise<string | null> {
  const { data } = await api.get('/method/frappe.client.get_value', {
    params: {
      doctype: 'Address',
      fieldname: 'pincode',
      filters: JSON.stringify({ name: addressName }),
    },
  })
  return data.message?.pincode || null
}
