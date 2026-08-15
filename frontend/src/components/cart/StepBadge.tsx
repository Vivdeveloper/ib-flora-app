export default function StepBadge({ step }: { step: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold text-white">
      {step}
    </span>
  )
}
