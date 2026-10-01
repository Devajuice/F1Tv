import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeTone =
  | 'neutral'
  | 'live'
  | 'next'
  | 'done'
  | 'good'
  | 'bad'
  | 'warn'
  | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-line/12 bg-veil/5 text-mist-300',
  live: 'border-live/40 bg-live/12 text-live',
  next: 'border-telemetry/40 bg-telemetry/12 text-telemetry',
  done: 'border-line/10 bg-veil/[0.03] text-mist-500',
  good: 'border-turf/35 bg-turf/10 text-turf',
  bad: 'border-f1-red/40 bg-f1-red/12 text-f1-red-bright',
  warn: 'border-sodium/40 bg-sodium/12 text-sodium',
  info: 'border-purple-fp/40 bg-purple-fp/12 text-purple-fp',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...rest
}: { tone?: BadgeTone; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-[0.12em] uppercase',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/** Pulsing red dot + optional label, for anything currently on air. */
export function LiveDot({
  label = 'Live',
  className,
  pulse = true,
}: {
  label?: string;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
    >
      <span className="relative flex size-2">
        {pulse && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70" />
        )}
        <span className="relative inline-flex size-2 rounded-full bg-live" />
      </span>
      {label && (
        <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-live uppercase">
          {label}
        </span>
      )}
    </span>
  );
}

/** Livery-coloured dot used to identify a constructor in dense tables. */
export function TeamDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'size-2 shrink-0 rounded-full ring-1 ring-line/15',
        className,
      )}
      style={{ backgroundColor: color }}
    />
  );
}
