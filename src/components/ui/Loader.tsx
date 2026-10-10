import { motion, useReducedMotion } from 'framer-motion'
import type { TargetAndTransition } from 'framer-motion'
import { cn } from '../../lib/cn'

export type LoaderVariant = 'bar' | 'orbit' | 'pulse' | 'dots'

interface LoaderProps {
  variant?: LoaderVariant
  /** Colour, defaults to the accent red. Accepts any CSS colour. */
  color?: string
  className?: string
  /** Accessible label announced to assistive tech. */
  label?: string
}

/**
 * Four calm loading indicators.
 *
 * Deliberately quiet: no spinning everything, no bouncing everything. Pick the
 * variant that matches the weight of the wait — a `bar` for a page region, a
 * `dots` trio for a button, an `orbit` when the thing is genuinely working.
 */
export function Loader({
  variant = 'bar',
  color,
  className,
  label = 'Loading',
}: LoaderProps) {
  const tint = color ?? 'var(--color-f1-red)'

  if (variant === 'orbit') {
    return (
      <span
        role="status"
        aria-label={label}
        className={cn('relative inline-flex size-6 items-center justify-center', className)}
      >
        <span
          className="absolute inset-0 rounded-full border-2 border-current opacity-20"
          style={{ color: tint }}
        />
        <span
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: tint }}
        />
        <span className="size-1 rounded-full" style={{ backgroundColor: tint }} />
      </span>
    )
  }

  if (variant === 'pulse') {
    return (
      <span
        role="status"
        aria-label={label}
        className={cn('inline-flex items-center gap-1', className)}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full"
            style={{
              backgroundColor: tint,
              animation: 'pulse-live 1.2s var(--ease-swift) infinite',
              animationDelay: `${i * 160}ms`,
            }}
          />
        ))}
      </span>
    )
  }

  if (variant === 'dots') {
    return (
      <span
        role="status"
        aria-label={label}
        className={cn('inline-flex items-end gap-1', className)}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full"
            style={{ backgroundColor: tint }}
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.12,
            }}
          />
        ))}
      </span>
    )
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex h-1 w-16 overflow-hidden rounded-full bg-veil/10', className)}
    >
      <span className="shimmer h-full w-1/3 rounded-full" />
    </span>
  )
}

/* ------------------------------------------------------------------------- */

const SHAPES = [
  'M50,6 C74,6 94,26 94,50 C94,74 74,94 50,94 C26,94 6,74 6,50 C6,26 26,6 50,6 Z',
  'M50,7 C76,3 97,24 93,49 C89,74 76,97 49,93 C22,89 3,74 7,49 C11,24 24,11 50,7 Z',
  'M48,5 C72,9 95,22 93,47 C91,72 80,95 52,95 C24,95 5,78 7,52 C9,26 24,1 48,5 Z',
  'M52,4 C78,10 96,28 92,52 C88,76 70,94 48,92 C26,90 6,72 8,48 C10,24 26,2 52,4 Z',
]

/**
 * SVG path loader that genuinely morphs between shapes.
 *
 * Every shape shares the same command skeleton (a move, four cubics and a
 * close), so Framer interpolates the path data point-by-point rather than
 * cross-fading two drawings. Under reduced motion it settles on one shape.
 */
export function MorphingShapeLoader({
  className,
  size = 40,
  color,
  label = 'Loading',
}: {
  className?: string
  size?: number
  color?: string
  label?: string
}) {
  const reduce = useReducedMotion()
  const frames = [...SHAPES, SHAPES[0]!]

  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="status"
      aria-label={label}
      className={className}
      style={{ color: color ?? 'var(--color-f1-red)' }}
    >
      <motion.path
        d={frames[0]}
        fill="currentColor"
        fillOpacity={0.14}
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
        animate={(reduce ? {} : { d: frames }) as TargetAndTransition}
        transition={
          reduce
            ? undefined
            : { duration: 7, repeat: Infinity, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] }
        }
      />
    </motion.svg>
  )
}
