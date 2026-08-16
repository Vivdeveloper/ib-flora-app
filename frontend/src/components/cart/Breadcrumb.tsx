import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  label: string
  to: string
}

const DEFAULT_CRUMBS: Crumb[] = [{ label: 'Home', to: '/' }]

export default function Breadcrumb({ current, crumbs = DEFAULT_CRUMBS }: { current: string; crumbs?: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
      {crumbs.map((crumb) => (
        <span key={crumb.to} className="flex items-center gap-1.5">
          <Link to={crumb.to} className="transition-colors hover:text-slate-700">
            {crumb.label}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden />
        </span>
      ))}
      <span className="font-semibold text-emerald-700" aria-current="page">
        {current}
      </span>
    </nav>
  )
}
