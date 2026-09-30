import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/cn';

/** Nothing-in-the-list state. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
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
      <div className="mb-4 flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-mist-400">
        {icon ?? <Inbox size={18} />}
      </div>
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
      icon={<AlertTriangle size={18} className="text-sodium" />}
      title={title}
      description={message ?? 'The upstream timing provider did not respond. Try again in a moment.'}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RotateCw size={12} />
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
      <span className="font-mono text-[10px] text-mist-500">{label}</span>
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Refresh"
        className="rounded-sm p-1 text-mist-500 transition-colors hover:bg-white/6 hover:text-mist-200 disabled:opacity-40"
        disabled={busy}
      >
        <RotateCw size={12} className={cn(busy && 'animate-spin')} />
      </button>
    </div>
  );
}
