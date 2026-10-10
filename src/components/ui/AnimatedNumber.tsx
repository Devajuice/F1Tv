import { useEffect, useMemo } from 'react'
import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { motionSprings } from '../../lib/motion'
import { cn } from '../../lib/cn'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

/**
 * One rolling digit column.
 *
 * Digits 0-9 are stacked in a fixed-height window and the stack is translated
 * by a spring. Because the number is rendered in the tabular `.num` face, every
 * column is exactly `1ch` wide, so columns never reflow as digits change.
 */
function DigitColumn({ digit }: { digit: number }) {
  const spring = useSpring(digit, motionSprings.springGentle)
  const y = useTransform(spring, (value) => `${-value}em`)

  useEffect(() => {
    spring.set(digit)
  }, [digit, spring])

  return (
    <span className="relative inline-block h-[1em] w-[1ch] overflow-hidden align-baseline">
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        style={{ y }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="flex h-[1em] w-full items-center justify-center">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

export interface AnimatedNumberProps {
  value: number | string
  /** Zero-pad the integer part to at least this many digits. */
  padStart?: number
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  /** Thousands separators. Off by default: most readouts here are short. */
  useGrouping?: boolean
  prefix?: string
  suffix?: string
  className?: string
  /** Render the value without rolling. Set automatically under reduced motion. */
  static?: boolean
}

/**
 * Digit-by-digit rolling counter.
 *
 * Each numeric column springs to its new digit independently, so a value like
 * 09 -> 10 rolls two columns at once instead of cross-fading the whole string.
 * Non-numeric glyphs (separators, minus) render statically in the same width.
 */
export function AnimatedNumber({
  value,
  padStart,
  minimumFractionDigits = 0,
  maximumFractionDigits = minimumFractionDigits,
  useGrouping = false,
  prefix,
  suffix,
  className,
  static: forceStatic,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion()

  const formatted = useMemo(() => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Intl.NumberFormat('en-US', {
        minimumIntegerDigits: padStart,
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping,
      }).format(value)
    }
    return String(value ?? '')
  }, [value, padStart, minimumFractionDigits, maximumFractionDigits, useGrouping])

  const plain = (
    <span className={cn('num leading-none tabular-nums', className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )

  if (forceStatic || reduce || typeof value !== 'number' || !Number.isFinite(value)) {
    return plain
  }

  return (
    <span
      className={cn('num inline-flex leading-none tabular-nums', className)}
      aria-label={`${prefix ?? ''}${formatted}${suffix ?? ''}`}
    >
      {prefix}
      <span aria-hidden className="inline-flex">
        {[...formatted].map((char, index) =>
          char >= '0' && char <= '9' ? (
            <DigitColumn key={index} digit={Number(char)} />
          ) : (
            <span key={index} className="inline-block w-[1ch] text-center">
              {char}
            </span>
          ),
        )}
      </span>
      {suffix}
    </span>
  )
}
