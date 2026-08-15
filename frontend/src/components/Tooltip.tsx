import * as Tooltip from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export default function IconTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="bottom"
          sideOffset={8}
          className="z-50 max-w-[220px] rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md"
        >
          {label}
          <Tooltip.Arrow className="fill-slate-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
