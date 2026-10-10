import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { motionTransitions } from '../../lib/motion'
import { cn } from '../../lib/cn'

export interface OriginDropdownItem {
  value: string
  label: string
  meta?: string
  lead?: ReactNode
}

interface OriginDropdownProps {
  items: OriginDropdownItem[]
  value: string
  onChange: (value: string) => void
  label?: string
  /** Trigger text when nothing matches. */
  placeholder?: string
  className?: string
  align?: 'start' | 'end'
}

const MENU_WIDTH = 240
const MENU_MAX_HEIGHT = 320

/**
 * Dropdown whose menu materialises from its own origin edge.
 *
 * Instead of a generic fade-and-scale from the centre, the panel starts a few
 * pixels out on the side of the trigger it is anchored to and springs inward,
 * with the transform origin pinned to that corner. The eye reads the menu as
 * growing out of the button rather than appearing in front of it.
 */
export function OriginDropdown({
  items,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  className,
  align = 'start',
}: OriginDropdownProps) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<{ top: number; left: number; fromBelow: boolean } | null>(
    null,
  )
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const selected = items.find((item) => item.value === value)

  const position = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.max(r.width, MENU_WIDTH)
    let left = align === 'end' ? r.right - width : r.left
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8)
    const below = window.innerHeight - r.bottom
    const fromBelow = below >= MENU_MAX_HEIGHT + 16 || r.top < MENU_MAX_HEIGHT
    const top = fromBelow ? r.bottom + 6 : Math.max(8, r.top - MENU_MAX_HEIGHT - 8)
    setRect({ top, left, fromBelow })
  }, [align])

  useLayoutEffect(() => {
    if (!open) return
    position()
    const onScroll = () => setOpen(false)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', position)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', position)
    }
  }, [open, position])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const originX = align === 'end' ? 'right' : 'left'
  const originY = rect?.fromBelow ? 'top' : 'bottom'
  const offset = rect?.fromBelow ? -6 : 6

  return (
    <div className={cn('relative inline-block', className)}>
      {label && (
        <span className="eyebrow mb-2 block" id={`${id}-label`}>
          {label}
        </span>
      )}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${id}-label` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-sm border px-3 text-[11px] font-semibold tracking-[0.06em] uppercase transition-colors duration-200',
          open
            ? 'border-f1-red/50 bg-f1-red/10 text-mist-50'
            : 'border-line/12 bg-veil/[0.03] text-mist-300 hover:border-line/20 hover:text-mist-50',
        )}
      >
        {selected?.lead}
        <span className="whitespace-nowrap">{selected?.label ?? placeholder}</span>
        <motion.span
          aria-hidden
          className="text-[8px] opacity-70"
          animate={{ rotate: open ? 180 : 0 }}
          transition={motionTransitions.springSnappy}
        >
          ▼
        </motion.span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && rect && (
            <motion.div
              ref={menuRef}
              role="listbox"
              aria-label={label ?? placeholder}
              initial={{ opacity: 0, scale: 0.94, y: offset, x: align === 'end' ? 6 : -6 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: offset / 2 }}
              transition={motionTransitions.springSmooth}
              style={{
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: MENU_WIDTH,
                maxHeight: MENU_MAX_HEIGHT,
                zIndex: 90,
                transformOrigin: `${originY} ${originX}`,
              }}
              className="no-scrollbar overflow-y-auto rounded-md border border-line/12 bg-ink-850 p-1.5 shadow-[0_20px_50px_-24px_rgb(0_0_0/0.9)]"
            >
              {items.map((item) => {
                const isSelected = item.value === value
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(item.value)
                      setOpen(false)
                      buttonRef.current?.focus()
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xs px-2.5 py-2 text-left transition-colors duration-150',
                      isSelected
                        ? 'bg-veil/8 text-mist-50'
                        : 'text-mist-300 hover:bg-veil/5 hover:text-mist-50',
                    )}
                  >
                    {item.lead}
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                      {item.label}
                    </span>
                    {isSelected && (
                      <span aria-hidden className="shrink-0 text-[10px] text-f1-red-bright">
                        ●
                      </span>
                    )}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
