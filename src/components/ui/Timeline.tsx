import { useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { motionTransitions } from '../../lib/motion'
import { cn } from '../../lib/cn'

export interface TimelineItem {
  id: string
  label: string
  /** Line under the label, e.g. date or circuit. */
  meta?: ReactNode
  /** Right-aligned value, e.g. the local start time. */
  time?: ReactNode
  status?: 'done' | 'active' | 'upcoming'
  /** Leading element before the label (badge, dot). */
  accessory?: ReactNode
  /** Optional expanded content; presence makes the row interactive. */
  detail?: ReactNode
}

interface InteractiveTimelineProps {
  items: TimelineItem[]
  className?: string
  /** Row expanded on first paint. Defaults to the active row. */
  initialExpandedId?: string
}

const NODE_TONES: Record<NonNullable<TimelineItem['status']>, string> = {
  done: 'border-line/20 bg-ink-800 text-mist-500',
  active: 'border-live/50 bg-live/15 text-live',
  upcoming: 'border-line/25 bg-ink-850 text-mist-600',
}

/**
 * Vertical milestone timeline with a filling progress rail.
 *
 * Built for the weekend schedule: each session is a node, the rail fills to the
 * last completed session, the live node pulses, and rows with detail unfold in
 * place. The rail fill is a single `scaleY`, so it animates without measuring
 * the variable row heights.
 */
export function InteractiveTimeline({
  items,
  className,
  initialExpandedId,
}: InteractiveTimelineProps) {
  const firstActive =
    items.find((item) => item.status === 'active')?.id ??
    items.find((item) => item.detail)?.id ??
    null
  const [expanded, setExpanded] = useState<string | null>(
    initialExpandedId ?? firstActive,
  )

  const doneCount = items.filter((item) => item.status === 'done').length
  const progress = items.length > 0 ? doneCount / items.length : 0

  return (
    <ol className={cn('relative', className)}>
      <span
        aria-hidden
        className="absolute top-4 bottom-4 left-[7px] w-px bg-line/10"
      />
      <motion.span
        aria-hidden
        className="absolute top-4 bottom-4 left-[7px] w-px origin-top bg-f1-red/60"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: progress }}
        transition={motionTransitions.springGentle}
      />

      {items.map((item) => {
        const status = item.status ?? 'upcoming'
        const isOpen = expanded === item.id
        const expandable = Boolean(item.detail)

        return (
          <li key={item.id} className="relative">
            <span
              aria-hidden
              className={cn(
                'absolute top-[15px] left-0 flex size-3.5 items-center justify-center rounded-full border',
                NODE_TONES[status],
              )}
            >
              {status === 'active' && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-live/40"
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  status === 'done' && 'bg-mist-500',
                  status === 'active' && 'bg-live',
                  status === 'upcoming' && 'bg-mist-600',
                )}
              />
            </span>

            <div className="pl-8">
              <button
                type="button"
                disabled={!expandable}
                aria-expanded={expandable ? isOpen : undefined}
                onClick={expandable ? () => setExpanded(isOpen ? null : item.id) : undefined}
                className={cn(
                  'flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-sm px-2 py-3 text-left transition-colors disabled:cursor-default',
                  expandable && 'hover:bg-veil/[0.03]',
                  status === 'done' && 'opacity-60',
                )}
              >
                {item.accessory}
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-mist-50">
                    {item.label}
                  </span>
                  {item.meta && (
                    <span className="mt-0.5 block font-mono text-[10.5px] text-mist-500">
                      {item.meta}
                    </span>
                  )}
                </span>
                {item.time && <span className="shrink-0 text-right">{item.time}</span>}
              </button>

              <AnimatePresence initial={false}>
                {isOpen && item.detail && (
                  <motion.div
                    key="detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={motionTransitions.springGentle}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -8 }}
                      animate={{ y: 0 }}
                      exit={{ y: -8 }}
                      transition={motionTransitions.springGentle}
                      className="px-2 pt-1 pb-4"
                    >
                      {item.detail}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
