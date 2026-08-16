import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Star, Flower2, Leaf } from 'lucide-react'
import Header from '../components/Header'
import ReviewModal from '../components/ReviewModal'
import FeatureBadges from '../components/products/FeatureBadges'
import CategoryChips from '../components/products/CategoryChips'
import {
  getWebsiteItems,
  getCategorySummary,
  getItemRatings,
  getItemCreationDates,
  type WebsiteItem,
  type CategorySummary,
  type ItemRating,
} from '../lib/api'
import { getItemDetails } from '../lib/cart'
import { useCart } from '../lib/CartContext'
import { CATEGORIES, DEFAULT_TAGLINE, isPerishable, type Category } from '../lib/categories'

const UOM_LABEL: Record<string, string> = { Nos: 'piece', Gram: 'gram', Kg: 'kg' }

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'newest'
type ViewMode = 'grid' | 'list'

const FAVORITES_KEY = 'ib-flora-favorites'

function loadFavorites(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryName = searchParams.get('category') ?? undefined
  const category: Category | undefined = CATEGORIES.find((c) => c.name === categoryName)

  const [items, setItems] = useState<WebsiteItem[]>([])
  const [uoms, setUoms] = useState<Record<string, string>>({})
  const [ratings, setRatings] = useState<Record<string, ItemRating>>({})
  const [creations, setCreations] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [heroImages, setHeroImages] = useState<Record<string, string | null>>({})
  const [sort, setSort] = useState<SortKey>('popular')
  const [view, setView] = useState<ViewMode>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites)
  const [qtyByItem, setQtyByItem] = useState<Record<string, number>>({})
  const [reviewingItem, setReviewingItem] = useState<WebsiteItem | null>(null)

  const { addToCart, loggedIn } = useCart()

  async function refreshRatings() {
    if (items.length) setRatings(await getItemRatings(items.map((i) => i.name)))
  }

  function setCategory(name?: string) {
    setSearchParams(name ? { category: name } : {})
  }

  useEffect(() => {
    getCategorySummary().then((rows: CategorySummary[]) => {
      setHeroImages(Object.fromEntries(rows.map((r) => [r.item_group, r.thumbnail])))
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    getWebsiteItems(categoryName)
      .then(async (data) => {
        setItems(data)
        const details = await getItemDetails(data.map((i) => i.item_code))
        setUoms(Object.fromEntries(Object.entries(details).map(([code, d]) => [code, d.stock_uom ?? ''])))
        setRatings(await getItemRatings(data.map((i) => i.name)))
        setCreations(await getItemCreationDates(data.map((i) => i.item_code)))
      })
      .catch(() => setError('Could not load products.'))
      .finally(() => setLoading(false))
  }, [categoryName])

  function toggleFavorite(itemCode: string) {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(itemCode)) next.delete(itemCode)
      else next.add(itemCode)
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]))
      return next
    })
  }

  function qtyFor(itemCode: string) {
    return qtyByItem[itemCode] ?? 1
  }

  function setQtyFor(itemCode: string, qty: number) {
    setQtyByItem((prev) => ({ ...prev, [itemCode]: Math.max(1, qty) }))
  }

  const visibleItems = useMemo(() => {
    let result = [...items]

    const min = priceMin ? Number(priceMin) : undefined
    const max = priceMax ? Number(priceMax) : undefined
    if (min !== undefined) result = result.filter((i) => (i.price_list_rate ?? 0) >= min)
    if (max !== undefined) result = result.filter((i) => (i.price_list_rate ?? 0) <= max)

    if (sort === 'price-asc') result.sort((a, b) => (a.price_list_rate ?? 0) - (b.price_list_rate ?? 0))
    else if (sort === 'price-desc') result.sort((a, b) => (b.price_list_rate ?? 0) - (a.price_list_rate ?? 0))
    else if (sort === 'newest') {
      result.sort((a, b) => (creations[b.item_code] ?? '').localeCompare(creations[a.item_code] ?? ''))
    }
    // 'popular' -- keep the order the backend already ranked

    return result
  }, [items, sort, priceMin, priceMax, creations])

  const heroImage = category ? heroImages[category.name] : heroImages['Puja Flowers']

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      {/* Category hero */}
      <div className="mx-auto w-full max-w-[1920px] px-3 pt-3 lg:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-rose-100/60 bg-gradient-to-br from-rose-50 via-rose-50/80 to-amber-50/40 shadow-sm">
          <div className="relative flex flex-col md:flex-row md:items-stretch">
            <div className="flex-1 px-6 py-7 sm:px-8 lg:px-10 lg:py-9">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {category?.name ?? 'All Products'}
              </h1>
              <p className="mt-2 max-w-md text-sm text-slate-600 sm:text-base">
                {category?.tagline ?? DEFAULT_TAGLINE}
              </p>

              <FeatureBadges className="mt-5" />

              <CategoryChips categories={CATEGORIES} active={categoryName} onSelect={setCategory} className="mt-5" />
            </div>

            <div
              aria-hidden
              className="relative order-first flex h-48 shrink-0 items-center justify-center self-center overflow-hidden sm:h-60 md:order-none md:h-72 md:w-[36%] lg:h-80 lg:w-[32%]"
            >
              {!heroImage && (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-100/70 via-amber-50/60 to-emerald-50/50" />
              )}
              {heroImage ? (
                <img
                  src={heroImage}
                  alt=""
                  className="relative h-full w-full object-cover"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent, black 62%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 62%)',
                  }}
                />
              ) : (
                <>
                  <Flower2 className="relative h-16 w-16 text-rose-300 sm:h-20 sm:w-20" strokeWidth={1} />
                  <Leaf
                    className="absolute left-[22%] top-[24%] h-6 w-6 text-emerald-300 sm:h-7 sm:w-7"
                    strokeWidth={1.5}
                  />
                  <Flower2
                    className="absolute bottom-[20%] right-[24%] h-7 w-7 text-amber-300 sm:h-8 sm:w-8"
                    strokeWidth={1.5}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1920px] px-6 py-6 lg:px-10">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Sort by:
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-800"
            >
              <option value="popular">Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">View:</span>
            <button
              onClick={() => setView('grid')}
              aria-label="Grid view"
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                view === 'grid' ? 'border-emerald-700 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500'
              }`}
            >
              ▦
            </button>
            <button
              onClick={() => setView('list')}
              aria-label="List view"
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                view === 'list' ? 'border-emerald-700 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500'
              }`}
            >
              ☰
            </button>

            <div className="relative">
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
              >
                ⚲ Filters
              </button>
              {filtersOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                  <p className="text-sm font-medium text-slate-700">Price range (₹)</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setPriceMin('')
                      setPriceMax('')
                    }}
                    className="mt-3 text-xs text-slate-500 underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 p-3">
                <div className="h-40 animate-pulse rounded-xl bg-slate-200/70" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-200/70" />
                <div className="mt-1 h-4 w-1/3 animate-pulse rounded bg-slate-200/70" />
              </div>
            ))}
          </div>
        )}
        {error && <p className="mt-8 text-red-600">{error}</p>}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${categoryName ?? 'all'}-${sort}-${view}-${priceMin}-${priceMax}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={
                view === 'grid'
                  ? 'mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                  : 'mt-6 flex flex-col gap-3'
              }
            >
              {visibleItems.map((item, i) => {
                const fresh = isPerishable(
                  CATEGORIES.find((c) => c.name === item.item_group)?.group ?? 'Puja Samagri',
                )
                const uomLabel = UOM_LABEL[uoms[item.item_code] ?? ''] ?? uoms[item.item_code]

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.25 }}
                    whileHover={{ y: -3, boxShadow: '0 10px 20px -8px rgb(0 0 0 / 0.15)' }}
                    className={
                      view === 'grid'
                        ? 'rounded-2xl border border-slate-100 p-3 shadow-sm'
                        : 'flex flex-col gap-3 rounded-2xl border border-slate-100 p-3 shadow-sm sm:flex-row sm:items-center sm:gap-4'
                    }
                  >
                    <div
                      className={
                        view === 'grid'
                          ? 'relative h-40 overflow-hidden rounded-xl bg-slate-100'
                          : 'relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100'
                      }
                    >
                      {fresh && (
                        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                          🌿 Fresh
                        </span>
                      )}
                      <button
                        onClick={() => toggleFavorite(item.item_code)}
                        aria-label="Toggle favorite"
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-sm"
                      >
                        {favorites.has(item.item_code) ? '❤️' : '🤍'}
                      </button>
                      {item.website_image ? (
                        <img
                          src={item.website_image}
                          alt={item.web_item_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className={view === 'grid' ? 'mt-2' : 'min-w-0 flex-1'}>
                      <p className="font-medium text-slate-900">{item.web_item_name}</p>
                      {item.web_long_description && (
                        <p className="mt-0.5 truncate text-sm text-slate-500">
                          {item.web_long_description.split('. ')[0]}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        {ratings[item.name] && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                            <span className="font-medium text-slate-700">{ratings[item.name].average}</span>
                            <span className="text-slate-400">({ratings[item.name].count})</span>
                          </div>
                        )}
                        <button
                          onClick={() => setReviewingItem(item)}
                          disabled={!loggedIn}
                          title={loggedIn ? undefined : 'Log in at /app/login to write a review'}
                          className="text-xs text-emerald-700 underline decoration-dotted disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                        >
                          Write a review
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.formatted_price ?? `₹${item.price_list_rate}`}
                        {uomLabel ? ` / ${uomLabel}` : ''}
                      </p>
                    </div>

                    <div className={view === 'grid' ? 'mt-3 flex items-center gap-2' : 'flex items-center gap-2'}>
                      <button
                        onClick={() => setQtyFor(item.item_code, qtyFor(item.item_code) - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm">{qtyFor(item.item_code)}</span>
                      <button
                        onClick={() => setQtyFor(item.item_code, qtyFor(item.item_code) + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                      >
                        +
                      </button>
                      <button
                        onClick={() => addToCart(item.item_code, qtyFor(item.item_code))}
                        disabled={!loggedIn}
                        title={loggedIn ? undefined : 'Log in at /app/login to use the cart'}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        🛒 Add to Cart
                      </button>
                    </div>
                  </motion.div>
                )
              })}
              {visibleItems.length === 0 && <p className="text-slate-500">No products found.</p>}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <div className="mt-4 bg-emerald-50/60 px-6 py-8 lg:px-10">
        <div className="mx-auto grid w-full max-w-[1920px] grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { icon: '🌿', title: '100% Fresh', subtitle: 'Handpicked with care' },
            { icon: '🚚', title: 'On-Time Delivery', subtitle: 'Right to your doorstep' },
            { icon: '🛡️', title: 'Secure Payment', subtitle: '100% safe & secure' },
            { icon: '🎧', title: 'Customer Support', subtitle: "We're here to help" },
          ].map((badge) => (
            <div key={badge.title} className="flex items-center gap-3">
              <span className="text-2xl">{badge.icon}</span>
              <div>
                <p className="font-medium text-slate-900">{badge.title}</p>
                <p className="text-sm text-slate-500">{badge.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {reviewingItem && (
        <ReviewModal
          websiteItemName={reviewingItem.name}
          itemName={reviewingItem.web_item_name}
          onClose={() => setReviewingItem(null)}
          onSubmitted={refreshRatings}
        />
      )}
    </div>
  )
}
