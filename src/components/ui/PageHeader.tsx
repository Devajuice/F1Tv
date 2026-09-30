import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  /** One line of context under the title. */
  description?: ReactNode;
  /** Right-aligned controls: selectors, refresh, tabs. */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Standard page masthead. Gives every page the same editorial rhythm:
 * small caps eyebrow, tight display title, muted description, controls right.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-7 sm:mb-9', className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="eyebrow mb-2.5 flex items-center gap-2">
              <span className="accent-bar inline-block h-2.5 w-1" />
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[clamp(1.75rem,4.5vw,2.5rem)] leading-[1.05] font-extrabold tracking-[-0.035em] text-mist-50">
            {title}
          </h1>
          {description && (
            <div className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-mist-400">
              {description}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {actions}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}

/** Standard page container. */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
