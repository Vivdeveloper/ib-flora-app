import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// The storefront is a standalone SPA with no Jinja-rendered shell, so unlike
// desk/website pages it has no page-embedded frappe.csrf_token. Frappe
// requires a matching X-Frappe-CSRF-Token on POST/PUT/DELETE whenever the
// session already has one (e.g. an Administrator also using Desk in the same
// browser shares that session cookie here) -- otherwise it 400s with
// CSRFTokenError. Fetch the token once and attach it to every request.
let csrfTokenPromise: Promise<string> | null = null

function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = axios
      .get('/api/method/ib_flora.api.get_csrf_token', { withCredentials: true })
      .then(({ data }) => data.message as string)
      .catch((err) => {
        csrfTokenPromise = null
        throw err
      })
  }
  return csrfTokenPromise
}

api.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase()
  if (method && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    config.headers['X-Frappe-CSRF-Token'] = await getCsrfToken()
  }
  return config
})

export interface DeliveryZoneCheck {
  zone_found: boolean
  territory?: string
  shipping_rule?: string
  delivery_charge?: number
  free_above_amount?: number
  same_day_eligible?: boolean
  is_active?: boolean
  cutoff_time?: string
  delivery_start?: string
  delivery_end?: string
}

export async function checkDeliveryZone(pincode: string): Promise<DeliveryZoneCheck> {
  const { data } = await api.get('/method/ib_flora.api.check_delivery_zone', {
    params: { pincode },
  })
  return data.message
}

export interface WebsiteItem {
  name: string
  web_item_name: string
  item_name: string
  item_code: string
  item_group: string
  website_image: string | null
  web_long_description: string | null
  route: string
  formatted_price?: string
  price_list_rate?: number
}

interface ProductFilterResponse {
  items: WebsiteItem[]
  items_count: number
}

// Wraps webshop's own standard product-listing endpoint
// (webshop.webshop.api.get_product_filter_data) -- the same one that
// powers the stock /all-products and Item Group category pages.
export async function getWebsiteItems(itemGroup?: string): Promise<WebsiteItem[]> {
  const { data } = await api.post('/method/webshop.webshop.api.get_product_filter_data', {
    query_args: itemGroup ? { item_group: itemGroup } : {},
  })
  const message = data.message as ProductFilterResponse
  return message.items
}

export interface CategorySummary {
  item_group: string
  count: number
  thumbnail: string | null
}

// One roundtrip for the homepage category grid (count + a representative
// thumbnail per leaf Item Group) instead of firing two Webshop API calls per
// category -- see ib_flora/api.py:get_category_summary.
export async function getCategorySummary(): Promise<CategorySummary[]> {
  const { data } = await api.get('/method/ib_flora.api.get_category_summary')
  return data.message
}

export interface SlideshowItem {
  idx: number
  heading: string
  description: string
  image: string | null
  url: string
}

// Real photo per homepage banner slide, sourced from the standard Website
// Slideshow doctype -- editable via Desk. See ib_flora/api.py:get_homepage_slideshow.
export async function getHomepageSlideshow(): Promise<SlideshowItem[]> {
  const { data } = await api.get('/method/ib_flora.api.get_homepage_slideshow')
  return data.message
}

export interface ItemRating {
  average: number
  count: number
}

// Real average rating + review count from the standard Item Review doctype,
// keyed by Website Item name (not item_code). No reviews exist in this store
// yet, so this comes back empty today -- deliberately not fabricating stars;
// see ib_flora/api.py:get_item_ratings. Products with no reviews are simply
// absent from the response, and the UI should skip the rating row for them.
export async function getItemRatings(websiteItemNames: string[]): Promise<Record<string, ItemRating>> {
  if (websiteItemNames.length === 0) return {}
  const { data } = await api.post('/method/ib_flora.api.get_item_ratings', {
    website_items: websiteItemNames,
  })
  return data.message
}

// Creation timestamps for the "Newest" sort option -- webshop's product
// listing endpoint doesn't return this field, so it's fetched separately;
// see ib_flora/api.py:get_item_creation_dates.
export async function getItemCreationDates(itemCodes: string[]): Promise<Record<string, string>> {
  if (itemCodes.length === 0) return {}
  const { data } = await api.post('/method/ib_flora.api.get_item_creation_dates', {
    item_codes: itemCodes,
  })
  return data.message
}

// Standard webshop review submission (webshop.webshop.doctype.item_review.item_review.add_item_review).
// Requires login (same as cart). `stars` is 1-5; the doctype's Rating field
// itself stores a 0-1 fraction. Silently no-ops server-side if this user has
// already reviewed this item (webshop's own dedup, not something we enforce).
export async function submitItemReview(
  websiteItemName: string,
  title: string,
  stars: number,
  comment: string,
): Promise<void> {
  await api.post('/method/webshop.webshop.doctype.item_review.item_review.add_item_review', {
    web_item: websiteItemName,
    title,
    rating: stars / 5,
    comment,
  })
}
