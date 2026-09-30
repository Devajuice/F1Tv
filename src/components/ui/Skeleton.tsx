import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Generic shimmer block. */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return <div className={cn('shimmer rounded-sm', className)} aria-hidden {...rest} />;
}

/** Shimmer sized to a line of body text. */
export function SkeletonText({
  className,
  width = '100%',
}: SkeletonProps & { width?: string }) {
  return (
    <div
      aria-hidden
      className={cn('shimmer h-3 rounded-sm', className)}
      style={{ width }}
    />
  );
}

/** A stack of shimmer lines, the default loading state for panels. */
export function SkeletonRows({
  rows = 4,
  className,
  gap = 'gap-3',
}: SkeletonProps & { rows?: number; gap?: string }) {
  return (
    <div className={cn('flex flex-col', gap, className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

/** Shimmer stand-in for the hero/stat cards. */
export function SkeletonStat() {
  return (
    <div className="panel p-5" aria-hidden>
      <Skeleton className="mb-3 h-2.5 w-16" />
      <Skeleton className="mb-2 h-7 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
