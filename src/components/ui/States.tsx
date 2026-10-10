import type { ReactNode } from 'react';
import { Button } from './Button';
import { Loader } from './Loader';
import { cn } from '../../lib/cn';

/** Centred loader block, the default mid-panel loading state. */
export function LoadingState({
  label = 'Loading',
  variant = 'bar',
  className,
}: {
  label?: string;
  variant?: 'bar' | 'orbit' | 'pulse' | 'dots';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14',
        className,
      )}
    >
      <Loader variant={variant} label={label} />
      <span className="font-mono text-[10px] tracking-[0.2em] text-mist-500 uppercase">
        {label}
      </span>
    </div>
  );
}

/** Nothing-in-the-list state. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
    >
      <h3 className="text-[14px] font-semibold text-mist-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-mist-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Error state with a retry affordance. */
export function ErrorState({
  title = 'Could not load data',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      className={className}
      title={title}
      description={message ?? 'The upstream timing provider did not respond. Try again in a moment.'}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    />
  );
}

/** Small inline "updated x ago" indicator with a manual refresh. */
export function RefreshHint({
  at,
  onRefresh,
  busy,
  className,
}: {
  at: number;
  onRefresh: () => void;
  busy?: boolean;
  className?: string;
}) {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
  const label =
    seconds < 5
      ? 'just now'
      : seconds < 60
        ? `${seconds}s ago`
        : `${Math.floor(seconds / 60)}m ago`;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {busy ? (
        <Loader variant="pulse" label="Refreshing" className="mr-0.5" />
      ) : (
        <span className="font-mono text-[10px] text-mist-500">{label}</span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={busy}
        className="font-mono text-[10px] tracking-[0.08em] text-mist-400 uppercase transition-colors hover:text-mist-200 disabled:opacity-40"
      >
        {busy ? 'Refreshing' : 'Refresh'}
      </button>
    </div>
  );
}
