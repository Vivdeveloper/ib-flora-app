import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

export interface Slide {
  image: string
  badge: string
  headingMain: string
  headingAccent: string
  subtitle: string
  accent: string // tailwind text-color class for the accent heading line + badge
  badgeBg: string // tailwind bg-color class for the badge pill
  primaryCta: { label: string; to: string }
  secondaryCta: { label: string; to: string }
  // True when `image` is a real photo uploaded via Desk (Website Slideshow),
  // as opposed to the generated fallback art. Real banners are typically
  // complete pre-designed graphics with their own text/icons baked in, so we
  // don't overlay our own badge/heading/buttons on top of them -- that's
  // what caused double-text collisions. Optional deskHeading/deskDescription
  // (also from Desk) render in a clean bar below the photo instead, only
  // when the uploader has actually filled them in.
  customImage?: boolean
  deskHeading?: string
  deskDescription?: string
}

const AUTO_ADVANCE_MS = 6000
const SWIPE_THRESHOLD = 60

export default function Carousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, AUTO_ADVANCE_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused, slides.length])

  function go(delta: number) {
    setIndex((i) => (i + delta + slides.length) % slides.length)
  }

  const hasBottomBar = slides.some((s) => s.customImage && (s.deskHeading || s.deskDescription))

  return (
    <div
      className="relative mx-auto w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="flex cursor-grab active:cursor-grabbing"
        animate={{ x: `-${index * 100}%` }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.7 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.x < -SWIPE_THRESHOLD) go(1)
          else if (info.offset.x > SWIPE_THRESHOLD) go(-1)
        }}
      >
        {slides.map((slide) =>
          slide.customImage ? (
            <div
              key={slide.headingMain}
              className="relative aspect-[2/1] max-h-[240px] w-full shrink-0 bg-stone-50 sm:max-h-[280px] md:max-h-[330px] lg:max-h-[380px] xl:max-h-[420px] 2xl:max-h-[460px]"
            >
              <Link to={slide.primaryCta.to} className="block h-full w-full">
                <img
                  src={slide.image}
                  alt={slide.deskHeading || slide.headingMain}
                  draggable={false}
                  className="h-full w-full select-none object-cover"
                />
              </Link>
              {(slide.deskHeading || slide.deskDescription) && (
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 bg-white/95 px-3 py-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-3">
                  <div className="min-w-0">
                    {slide.deskHeading && (
                      <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                        {slide.deskHeading}
                      </p>
                    )}
                    {slide.deskDescription && (
                      <p className="hidden text-sm text-slate-500 sm:block">{slide.deskDescription}</p>
                    )}
                  </div>
                  <Link
                    to={slide.primaryCta.to}
                    className="shrink-0 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 sm:px-4 sm:py-2 sm:text-sm"
                  >
                    Shop Now
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div
              key={slide.headingMain}
              className="relative h-[240px] w-full shrink-0 sm:h-[280px] md:h-[330px] lg:h-[380px] xl:h-[420px] 2xl:h-[460px]"
            >
              <img
                src={slide.image}
                alt=""
                draggable={false}
                className="h-full w-full select-none object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/55 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 lg:px-14">
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${slide.badgeBg} ${slide.accent}`}
                >
                  {slide.badge}
                </span>
                <h2 className="mt-3 max-w-md text-2xl font-bold leading-tight text-slate-900 sm:mt-4 sm:text-3xl md:text-4xl">
                  {slide.headingMain}
                  <br />
                  <span className={slide.accent}>{slide.headingAccent}</span>
                </h2>
                <p className="mt-2 max-w-sm text-xs text-slate-600 sm:mt-4 sm:text-sm md:text-base">
                  {slide.subtitle}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
                  <Link
                    to={slide.primaryCta.to}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-800 sm:px-5 sm:py-2.5 sm:text-sm"
                  >
                    {slide.primaryCta.label}
                  </Link>
                  <Link
                    to={slide.secondaryCta.to}
                    className="rounded-lg border border-slate-300 bg-white/90 px-4 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-400 sm:px-5 sm:py-2.5 sm:text-sm"
                  >
                    {slide.secondaryCta.label}
                  </Link>
                </div>
              </div>
            </div>
          ),
        )}
      </motion.div>

      <button
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow transition hover:scale-110 hover:bg-white"
      >
        ‹
      </button>
      <button
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow transition hover:scale-110 hover:bg-white"
      >
        ›
      </button>

      <div
        className={`absolute left-1/2 flex -translate-x-1/2 gap-2 ${hasBottomBar ? 'bottom-14 sm:bottom-20' : 'bottom-4'}`}
      >
        {slides.map((slide, i) => (
          <button
            key={slide.headingMain}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-slate-900' : 'w-2 bg-slate-900/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
