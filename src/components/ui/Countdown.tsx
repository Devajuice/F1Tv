import { getCountdownParts } from '../../lib/format';
import { useNow } from '../../hooks/useAsync';
import { cn } from '../../lib/cn';

interface CountdownProps {
  target: string | Date | null;
  /** Largest unit to display. */
  maxUnit?: 'days' | 'hours';
  className?: string;
  compact?: boolean;
}

const LABELS = { days: 'D', hours: 'H', minutes: 'M', seconds: 'S' } as const;

/**
 * Session countdown.
 *
 * Ticks off `useNow` rather than owning its own interval, so several
 * countdowns on a page share one timer and all of them stop when the tab is
 * hidden.
 */
export function Countdown({
  target,
  maxUnit = 'days',
  className,
  compact,
}: CountdownProps) {
  const now = useNow(1000);
  const parts = getCountdownParts(target, now);
  const done = parts.total <= 0;

  const units: Array<keyof typeof LABELS> =
    maxUnit === 'days'
      ? ['days', 'hours', 'minutes', 'seconds']
      : ['hours', 'minutes', 'seconds'];

  // Suppress leading zero units (e.g. no "00d" for a 3-hour wait) but always
  // show at least the last two.
  const firstSignificant = Math.max(
    0,
    units.findIndex((u) => parts[u] > 0 || u === 'seconds'),
  );
  const visible = units.slice(Math.min(firstSignificant, units.length - 2));

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      aria-live="off"
      aria-label={done ? 'Starting now' : 'Time remaining'}
    >
      {visible.map((unit) => (
        <div
          key={unit}
          className={cn(
            'flex min-w-9 flex-col items-center justify-center rounded-xs border border-line/8 bg-veil/[0.045] px-1.5 py-1.5',
            compact && 'min-w-8 py-1',
          )}
        >
          <span
            className={cn(
              'num text-[15px] leading-none font-semibold text-mist-50 tabular-nums',
              compact && 'text-[13px]',
            )}
          >
            {String(parts[unit]).padStart(2, '0')}
          </span>
          <span className="mt-1 font-mono text-[8px] leading-none tracking-[0.14em] text-mist-500">
            {LABELS[unit]}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Single large figure, for "2 days to go" style hero stats. */
export function CountdownStat({
  target,
  label,
  className,
}: {
  target: string | Date | null;
  label: string;
  className?: string;
}) {
  const now = useNow(1000);
  const parts = getCountdownParts(target, now);

  const value =
    parts.total <= 0
      ? 'NOW'
      : parts.days > 0
        ? String(parts.days)
        : parts.hours > 0
          ? String(parts.hours)
          : String(parts.minutes);

  const unit =
    parts.total <= 0
      ? 'Live'
      : parts.days > 0
        ? parts.days === 1
          ? 'day'
          : 'days'
        : parts.hours > 0
          ? 'hours'
          : 'min';

  return (
    <div className={className}>
      <p className="num text-3xl leading-none font-bold text-mist-50 sm:text-4xl">
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[10px] tracking-[0.14em] text-mist-400 uppercase">
        {parts.total <= 0 ? unit : `${unit} · ${label}`}
      </p>
    </div>
  );
}
