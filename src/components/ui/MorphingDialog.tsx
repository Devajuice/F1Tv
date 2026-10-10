import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { motionTransitions } from '../../lib/motion'
import { cn } from '../../lib/cn'

interface MorphingDialogProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
  /** Hide the default close button (e.g. for confirmations). */
  hideClose?: boolean
}

/**
 * Portal dialog that settles into place instead of popping.
 *
 * The panel scales 0.94 -> 1.01 -> 1 (a small overshoot) with a short downward
 * travel, and the body layers its own delayed settle on top. Escape, focus
 * trapping and scroll lock behave exactly as the plain modal did, so it is a
 * drop-in replacement.
 */
export function MorphingDialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  hideClose,
}: MorphingDialogProps) {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key !== 'Tab') return

      const focusables = document.querySelectorAll<HTMLElement>(
        '[data-dialog] button, [data-dialog] a[href], [data-dialog] input, [data-dialog] [tabindex]:not([tabindex="-1"])',
      )
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previouslyFocused = document.activeElement as HTMLElement | null

    window.addEventListener('keydown', onKeyDown, true)
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-dialog] button')?.focus()
    })

    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionTransitions.easeSoft}
            className="absolute inset-0 cursor-default bg-ink-950/85 backdrop-blur-[2px]"
          />
          <motion.div
            data-dialog
            role="dialog"
            aria-modal="true"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 18 }}
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, scale: [0.94, 1.012, 1], y: [18, -3, 0] }
            }
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={
              reduce
                ? motionTransitions.easeFast
                : { duration: 0.42, times: [0, 0.6, 1], ease: [0.16, 1, 0.3, 1] }
            }
            className={cn(
              'relative w-full max-w-lg overflow-hidden rounded-md border border-line/12 bg-ink-850',
              className,
            )}
          >
            {(title || !hideClose) && (
              <div className="hairline-b flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  {title && (
                    <h2 className="font-display text-lg font-bold tracking-tight text-mist-50">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-[12.5px] text-mist-400">{description}</p>
                  )}
                </div>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mt-1 -mr-1 px-1.5 py-0.5 text-lg leading-none text-mist-400 transition-colors hover:text-mist-100"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-h-[70vh] overflow-y-auto p-5"
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
