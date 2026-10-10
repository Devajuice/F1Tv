import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { motionTransitions } from '../../lib/motion'
import { cn } from '../../lib/cn'

export interface SpringSelectOption {
  value: string
  label: string
  /** Secondary line, e.g. a time zone offset. */
  meta?: string
  /** Leading element, e.g. a flag. */
  lead?: React.ReactNode
  disabled?: boolean
}

interface SpringSelectProps {
  options: SpringSelectOption[]
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  buttonClassName?: string
  align?: 'start' | 'end'
}

const MENU_WIDTH = 280
const MENU_MAX_HEIGHT = 340

/**
 * Select whose menu springs into place.
 *
 * The panel slides down with a gentle overshoot and the chevron rotates a hair
 * past 180 degrees before settling — the same physical read as the shared
 * motion tokens, applied to a form control. Positioning is the portal +
 * `getBoundingClientRect` approach used across the app, so it escapes any
 * clipping ancestor.
 */
export function SpringSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  className,
  buttonClassName,
  align = 'start',
}: SpringSelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const selected = options.find((option) => option.value === value)

  const position = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.max(r.width, MENU_WIDTH)
    let left = align === 'end' ? r.right - width : r.left
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8)
    const below = window.innerHeight - r.bottom
    const top =
      below < MENU_MAX_HEIGHT + 16 && r.top > MENU_MAX_HEIGHT
        ? Math.max(8, r.top - MENU_MAX_HEIGHT - 8)
        : r.bottom + 6
    setRect({ top, left })
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
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)))
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const commit = (option: SpringSelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (options[activeIndex]) commit(options[activeIndex])
        break
      default:
        break
    }
  }

  return (
    <div className={cn('relative', className)} onKeyDown={onKeyDown}>
      {label && (
        <label htmlFor={id} className="eyebrow mb-2 block truncate">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-sm border border-line/10 bg-ink-800/80 px-3 py-2.5 text-left transition-colors duration-250 hover:border-line/20 hover:bg-ink-700/80',
          open && 'border-f1-red/50 bg-ink-700/90',
          buttonClassName,
        )}
      >
        {selected?.lead}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-mist-50">
            {selected?.label ?? placeholder}
          </span>
          {selected?.meta && (
            <span className="mt-0.5 block truncate font-mono text-[10px] text-mist-400">
              {selected.meta}
            </span>
          )}
        </span>
        <motion.span
          aria-hidden
          className="shrink-0 text-[10px] text-mist-400"
          animate={{ rotate: open ? 190 : 0 }}
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
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={motionTransitions.springSmooth}
              style={{
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: MENU_WIDTH,
                maxHeight: MENU_MAX_HEIGHT,
                zIndex: 90,
                transformOrigin: align === 'end' ? 'top right' : 'top left',
              }}
              className="flex flex-col overflow-hidden rounded-md border border-line/12 bg-ink-850 shadow-[0_20px_50px_-24px_rgb(0_0_0/0.9)]"
            >
              <div className="no-scrollbar flex-1 overflow-y-auto p-1.5">
                {options.map((option, index) => {
                  const isSelected = option.value === value
                  const isActive = index === activeIndex
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => commit(option)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xs px-2.5 py-2 text-left transition-colors duration-150',
                        option.disabled && 'pointer-events-none opacity-35',
                        isActive ? 'bg-veil/8 text-mist-50' : 'text-mist-200 hover:bg-veil/4',
                      )}
                    >
                      {option.lead}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium">
                          {option.label}
                        </span>
                        {option.meta && (
                          <span className="block truncate font-mono text-[10px] text-mist-500">
                            {option.meta}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <span aria-hidden className="shrink-0 text-[10px] text-mist-300">
                          ●
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
