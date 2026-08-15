import type { Category } from '../../lib/categories'

interface CategoryChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

function CategoryChip({ label, selected, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
        selected
          ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
          : 'border-slate-200 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white hover:shadow-sm'
      }`}
    >
      {label}
    </button>
  )
}

interface CategoryChipsProps {
  categories: Category[]
  active?: string
  onSelect: (name?: string) => void
  className?: string
}

export default function CategoryChips({ categories, active, onSelect, className = '' }: CategoryChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <CategoryChip label="All" selected={active === undefined} onClick={() => onSelect(undefined)} />
      {categories.map((c) => (
        <CategoryChip key={c.name} label={c.name} selected={active === c.name} onClick={() => onSelect(c.name)} />
      ))}
    </div>
  )
}
