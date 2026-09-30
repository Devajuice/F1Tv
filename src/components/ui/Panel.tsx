import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover lift + border brighten. */
  interactive?: boolean;
  /** Removes the default padding. */
  flush?: boolean;
  children?: ReactNode;
}

export function Panel({
  interactive,
  flush,
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <div
      className={cn(
        'panel',
        interactive && 'panel-interactive',
        !flush && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Section heading with the broadcast eyebrow label above it. */
export function PanelTitle({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-base font-semibold tracking-tight text-mist-50 sm:text-lg">
          {title}
        </h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
