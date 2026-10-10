import { useMemo } from 'react'
import { useNow } from '../../hooks/useAsync'
import { cn } from '../../lib/cn'

/**
 * A 5x7 dot-matrix face. Only what a clock needs: ten digits, the colon and a
 * blank. Rows are top-to-bottom, columns left-to-right.
 */
const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['00000', '00110', '00110', '00000', '00110', '00110', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}

const GLYPH_W = 5
const GLYPH_H = 7
const GAP = 1

export interface MatrixClockProps {
  /** IANA zone to render in. Omit for the browser zone. */
  timeZone?: string | null
  /** Show seconds. Adds two digit columns and ticks once a second. */
  withSeconds?: boolean
  /** Freeze at a specific instant instead of tracking the clock. */
  date?: Date
  className?: string
  /** Colour of lit dots. Defaults to currentColor. */
  tone?: string
}

/**
 * Airport-style dot-matrix clock.
 *
 * Renders the current time as a grid of physical dots; each dot transitions its
 * opacity so a digit change reads as lights coming on and off rather than text
 * being swapped. Live by default via `useNow`, which stops while the tab is
 * hidden.
 */
export function MatrixClock({
  timeZone,
  withSeconds = false,
  date,
  className,
  tone,
}: MatrixClockProps) {
  const now = useNow(withSeconds ? 1000 : 30_000)

  const text = useMemo(() => {
    const at = date ?? new Date(now)
    try {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        ...(withSeconds ? { second: '2-digit' as const } : {}),
        hour12: false,
        timeZone: timeZone ?? undefined,
      }).format(at)
    } catch {
      return '--:--'
    }
  }, [date, now, timeZone, withSeconds])

  const chars = [...text]
  const columns = chars.length * (GLYPH_W + GAP) - GAP

  return (
    <svg
      viewBox={`0 0 ${columns} ${GLYPH_H}`}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={`${text}${withSeconds ? '' : ':00'}${timeZone ? ` ${timeZone}` : ''}`}
      style={{ color: tone }}
    >
      {chars.map((char, charIndex) => {
        const glyph = GLYPHS[char] ?? GLYPHS[' ']!
        const originX = charIndex * (GLYPH_W + GAP)
        return glyph.flatMap((row, y) =>
          [...row].map((cell, x) => (
            <circle
              key={`${charIndex}-${x}-${y}`}
              cx={originX + x + 0.5}
              cy={y + 0.5}
              r={0.34}
              fill="currentColor"
              style={{
                opacity: cell === '1' ? 1 : 0.07,
                transition: 'opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          )),
        )
      })}
    </svg>
  )
}
