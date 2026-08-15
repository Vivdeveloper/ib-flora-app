import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { LayoutGrid, ArrowRight } from 'lucide-react'
import Header from '../components/Header'
import Carousel, { type Slide } from '../components/Carousel'
import {
  getCategorySummary,
  getHomepageSlideshow,
  type CategorySummary,
  type SlideshowItem,
} from '../lib/api'
import { CATEGORIES } from '../lib/categories'

// Marketing copy + styling live here; the photo for each slide is sourced
// from the standard Website Slideshow doctype when uploaded via Desk (see
// the merge in Home() below), falling back to this generated art otherwise.
const SLIDES_BASE: Slide[] = [
  {
    image: '/banners/flowers.png',
    badge: '🌸 Fresh & Beautiful',
    headingMain: 'Fresh Flowers,',
    headingAccent: 'Delivered Daily',
    subtitle: 'Hand-picked marigolds, roses & seasonal blooms for every puja and occasion.',
    accent: 'text-rose-600',
    badgeBg: 'bg-rose-100',
    primaryCta: { label: '🛒 Shop Now', to: '/products' },
    secondaryCta: { label: '🎁 Send a Gift', to: '/products?category=Bouquets' },
  },
  {
    image: '/banners/same-day.png',
    badge: '⏱️ Fast & Reliable',
    headingMain: 'Order Today,',
    headingAccent: 'Get It Today',
    subtitle: 'Order before your zone’s cutoff time and get it delivered the same day.',
    accent: 'text-amber-600',
    badgeBg: 'bg-amber-100',
    primaryCta: { label: '🛒 Shop Now', to: '/products' },
    secondaryCta: { label: '📍 Check My Zone', to: '/products' },
  },
  {
    image: '/banners/puja-samagri.png',
    badge: '🪔 Complete Rituals',
    headingMain: 'Puja Samagri,',
    headingAccent: 'All in One Place',
    subtitle: 'Incense, kits, brass items and thalis — everything for your rituals.',
    accent: 'text-emerald-600',
    badgeBg: 'bg-emerald-100',
    primaryCta: { label: '🛒 Shop Now', to: '/products?category=Puja Kits' },
    secondaryCta: { label: 'Explore All', to: '/products' },
  },
  {
    image: '/banners/garlands.png',
    badge: '💐 Handmade Fresh',
    headingMain: 'Garlands &',
    headingAccent: 'Bouquets',
    subtitle: 'Handmade fresh, strung and wrapped the same day you order.',
    accent: 'text-violet-600',
    badgeBg: 'bg-violet-100',
    primaryCta: { label: '🛒 Shop Now', to: '/products?category=Garlands' },
    secondaryCta: { label: '🎁 Send a Gift', to: '/products?category=Bouquets' },
  },
]

const CATEGORY_STYLES: Record<string, string> = {
  Flowers: 'bg-rose-50',
  'Puja Samagri': 'bg-amber-50',
  'Rental Samagri': 'bg-emerald-50',
}

export default function Home() {
  const [summary, setSummary] = useState<Record<string, CategorySummary>>({})
  const [loaded, setLoaded] = useState(false)
  const [deskSlides, setDeskSlides] = useState<Record<number, SlideshowItem>>({})

  useEffect(() => {
    getCategorySummary()
      .then((rows) => {
        setSummary(Object.fromEntries(rows.map((r) => [r.item_group, r])))
      })
      .catch(() => {})
      .finally(() => setLoaded(true))

    getHomepageSlideshow()
      .then((rows) => {
        setDeskSlides(Object.fromEntries(rows.filter((r) => r.image).map((r) => [r.idx - 1, r])))
      })
      .catch(() => {})
  }, [])

  const slides = useMemo(
    () =>
      SLIDES_BASE.map((slide, i) => {
        const desk = deskSlides[i]
        if (!desk) return slide
        return {
          ...slide,
          image: desk.image as string,
          customImage: true,
          deskHeading: desk.heading || undefined,
          deskDescription: desk.description || undefined,
          primaryCta: desk.url ? { ...slide.primaryCta, to: desk.url } : slide.primaryCta,
        }
      }),
    [deskSlides],
  )

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="mx-auto w-full max-w-[1600px] pb-8">
        <Carousel slides={slides} />

        <div className="mt-10 flex flex-col gap-3 px-6 sm:flex-row sm:items-end sm:justify-between lg:px-10">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <LayoutGrid className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              </span>
              Shop by Category
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Explore our wide range of fresh flowers and essentials
            </p>
          </div>
          <Link
            to="/products"
            className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            View All Categories <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-5 px-6 sm:grid-cols-3 md:grid-cols-5 lg:px-10">
          {CATEGORIES.map((category, i) => {
            const row = summary[category.name]
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: 'easeOut' }}
              >
                <Link to={`/products?category=${encodeURIComponent(category.name)}`}>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgb(0 0 0 / 0.18)' }}
                    className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <div
                      className={`flex aspect-[4/3] items-center justify-center ${CATEGORY_STYLES[category.group]}`}
                    >
                      {!loaded ? (
                        <div className="h-full w-full animate-pulse bg-slate-200/70" />
                      ) : row?.thumbnail ? (
                        <img
                          src={row.thumbnail}
                          alt={category.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-semibold text-slate-300">
                          {category.name[0]}
                        </span>
                      )}
                    </div>
                    <div className="bg-white p-3">
                      <p className="font-semibold text-slate-900">{category.name}</p>
                      <p className="text-sm text-slate-400">
                        {loaded ? `${row?.count ?? 0} products` : '···'}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mx-6 mt-12 overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-b from-rose-50 to-white shadow-sm lg:mx-10"
        >
          <img
            src="/banners/ib-flora-baseline.png"
            alt="IB Flora — Fresh Flowers, Honest Promises: farm fresh quality, handcrafted with love, safe & timely delivery, longer lasting joy, 100% happiness"
            className="h-auto w-full object-cover"
            loading="lazy"
          />
        </motion.div>
      </main>
    </div>
  )
}
