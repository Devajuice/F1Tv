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
    <header className={cn('mb-8 sm:mb-10', className)}>
      <div className="flex flex-col gap-5 rounded-2xl border border-line/10 bg-ink-850/45 p-5 backdrop-blur-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
          <h1 className="font-display text-[clamp(1.9rem,4.8vw,3rem)] leading-[0.98] font-black tracking-[-0.045em] text-mist-50">
            {title}
          </h1>
          {description && (
            <div className="mt-3 max-w-3xl text-[14px] leading-relaxed text-mist-400 sm:text-[15px]">
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
