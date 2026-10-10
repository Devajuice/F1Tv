import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { motionTransitions } from '../../lib/motion'
import { cn } from '../../lib/cn'

export interface UnfoldAccordionProps {
  open: boolean
  onToggle?: () => void
  /** Content rendered inside the trigger button. */
  header: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  showChevron?: boolean
}

/**
 * Accordion whose content unfolds rather than appearing.
 *
 * The height, the chevron and the inner copy all move on the same spring: the
 * chevron crosses 180 degrees while the panel grows, and the body slides up a
 * few pixels so the gap closes as one gesture. `height: 'auto'` is measured by
 * Framer, so nested content of any size works.
 */
export function UnfoldAccordion({
  open,
  onToggle,
  header,
  children,
  className,
  headerClassName,
  contentClassName,
  showChevron = true,
}: UnfoldAccordionProps) {
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={cn('w-full text-left', headerClassName)}
      >
        {header}
        {showChevron && (
          <motion.span
            aria-hidden
            className={cn(
              'shrink-0 text-[9px] transition-colors',
              open ? 'text-mist-300' : 'text-mist-500',
            )}
            animate={{ rotate: open ? 180 : 0 }}
            transition={motionTransitions.springGentle}
          >
            ▼
          </motion.span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="unfold"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionTransitions.springGentle}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={motionTransitions.springGentle}
              className={contentClassName}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
