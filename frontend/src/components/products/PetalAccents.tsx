// Purely decorative soft petal shapes for the hero card background.
// Kept to a few small blurred blobs so it reads as ambience, not clutter.
export default function PetalAccents() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-6 top-8 h-16 w-16 rotate-12 rounded-[60%_40%_60%_40%] bg-gradient-to-br from-rose-200/70 to-rose-300/30 blur-[2px]" />
      <div className="absolute bottom-8 left-12 h-6 w-6 -rotate-12 rounded-[60%_40%_60%_40%] bg-rose-300/50 blur-[1px]" />
      <div className="absolute bottom-14 left-24 h-4 w-4 rotate-45 rounded-[60%_40%_60%_40%] bg-rose-400/40 blur-[1px]" />
    </div>
  )
}
