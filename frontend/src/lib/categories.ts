// The 9 published (show_in_website=1) leaf Item Groups created for IB Flora.
// Webshop has no guest-accessible "list item groups" endpoint (Item Group's
// standard permissions don't include Guest), so this mirrors real backend
// data rather than fetching it live. Product data itself is always fetched
// live via getWebsiteItems().
export interface Category {
  name: string
  group: 'Flowers' | 'Puja Samagri' | 'Rental Samagri'
  tagline: string
}

export const CATEGORIES: Category[] = [
  {
    name: 'Puja Flowers',
    group: 'Flowers',
    tagline: 'Everything you need for a beautiful and divine puja. Fresh. Handpicked. Delivered with care.',
  },
  {
    name: 'Cut Flowers',
    group: 'Flowers',
    tagline: 'Freshly cut flowers, handpicked daily for bouquets, decor and gifting.',
  },
  {
    name: 'Garlands',
    group: 'Flowers',
    tagline: 'Traditional handmade garlands for puja, festivals and celebrations.',
  },
  {
    name: 'Bouquets',
    group: 'Flowers',
    tagline: 'Beautifully wrapped bouquets for every occasion and emotion.',
  },
  {
    name: 'Green Leaves',
    group: 'Flowers',
    tagline: 'Fresh leaves for puja offerings and traditional decoration.',
  },
  {
    name: 'Incense & Dhoop',
    group: 'Puja Samagri',
    tagline: 'Fragrant incense and dhoop for a peaceful, mindful puja.',
  },
  {
    name: 'Puja Kits',
    group: 'Puja Samagri',
    tagline: 'Complete puja kits with everything you need, curated in one box.',
  },
  {
    name: 'Brass Items',
    group: 'Rental Samagri',
    tagline: 'Traditional brass items built to last, for daily and festive rituals.',
  },
  {
    name: 'Puja Thali',
    group: 'Rental Samagri',
    tagline: 'Elegant thalis for aarti and puja, ready for every ritual.',
  },
]

export const DEFAULT_TAGLINE = 'Fresh flowers and puja essentials, delivered to your doorstep.'

// Only the Flowers super-group is perishable in the "Fresh" sense.
export function isPerishable(group: Category['group']): boolean {
  return group === 'Flowers'
}
