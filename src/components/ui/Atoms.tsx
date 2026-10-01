import type { ReactNode } from 'react';
import { Flag as FlagIcon } from 'lucide-react';
import { countryFlag, initials } from '../../lib/format';
import { cn } from '../../lib/cn';

/** Flag emoji, with a chequered fallback for unknown countries. */
export function Flag({ country }: { country: string | null | undefined }) {
  if (!country) return null;
  return (
    <span aria-hidden className="text-[13px] leading-none">
      {countryFlag(country)}
    </span>
  );
}

export function FlagWithName({
  country,
  className,
}: {
  country: string | null | undefined;
  className?: string;
}) {
  if (!country) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Flag country={country} />
      <span>{country}</span>
    </span>
  );
}

/** Number avatar tinted with the driver's team colour. */
export function DriverAvatar({
  number,
  name,
  color,
  size = 'md',
  className,
}: {
  number?: string;
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'size-9 text-[11px]',
    md: 'size-12 text-sm',
    lg: 'size-16 text-lg',
    xl: 'size-24 text-3xl',
  } as const;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-extrabold tracking-tight text-ink-950 select-none',
        sizes[size],
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(155deg, color-mix(in oklab, ${color} 88%, white 12%) 0%, ${color} 52%, color-mix(in oklab, ${color} 70%, black 30%) 100%)`,
      }}
    >
      <span className="drop-shadow-[0_1px_0_rgb(255_255_255/0.28)]">
        {number || initials(name)}
      </span>
      {/* Inner ring for separation against team colours. */}
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-ink-950/25 ring-inset" />
    </div>
  );
}

/** Labelled statistic used in hero and summary rows. */
export function Stat({
  label,
  value,
  hint,
  tone = 'default',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'accent' | 'live';
  className?: string;
}) {
  const valueTone =
    tone === 'accent'
      ? 'text-f1-red-bright'
      : tone === 'live'
        ? 'text-live'
        : 'text-mist-50';

  return (
    <div className={cn('min-w-0', className)}>
      <p className="eyebrow">{label}</p>
      <p className={cn('num mt-2 text-xl leading-none font-bold', valueTone)}>
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 truncate text-[11.5px] text-mist-500">{hint}</p>
      )}
    </div>
  );
}

/** Thin horizontal meter, e.g. points relative to the leader. */
export function Meter({
  value,
  color,
  className,
  delay = 0,
}: {
  /** 0-1 */
  value: number;
  color: string;
  className?: string;
  delay?: number;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      className={cn('h-1 w-full overflow-hidden rounded-full bg-veil/6', className)}
    >
      <div
        className="bar-x h-full rounded-full"
        style={{
          width: `${clamped * 100}%`,
          background: `linear-gradient(90deg, color-mix(in oklab, ${color} 55%, black), ${color})`,
          animationDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

/** Full-width chequered flag divider — a light broadcast motif. */
export function ChequerDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('h-1.5 w-full opacity-25', className)}
      style={{
        backgroundImage:
          'repeating-conic-gradient(#fff 0% 25%, #000 0% 50%)',
        backgroundSize: '12px 12px',
      }}
    />
  );
}

/** Placeholder icon tile for news with no usable thumbnail. */
export function ArticlePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-full items-center justify-center bg-linear-to-br from-ink-800 to-ink-900 text-mist-500',
        className,
      )}
    >
      <FlagIcon size={20} />
    </div>
  );
}
