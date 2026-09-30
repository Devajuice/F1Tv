import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'live';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-sm font-semibold uppercase tracking-[0.08em] whitespace-nowrap transition-all duration-300 ease-expo disabled:pointer-events-none disabled:opacity-40';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-br from-f1-red to-f1-red-deep text-white shadow-red hover:from-f1-red-bright hover:to-f1-red hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'border border-white/12 bg-white/5 text-mist-100 backdrop-blur-md hover:border-white/25 hover:bg-white/9 hover:-translate-y-0.5 active:translate-y-0',
  ghost:
    'text-mist-300 hover:bg-white/6 hover:text-mist-50 active:bg-white/10',
  live:
    'bg-live text-white shadow-[0_8px_32px_-10px_rgb(255_59_48/0.6)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[10px]',
  md: 'h-10 px-4 text-[11px]',
  lg: 'h-12 px-6 text-xs',
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {/* Sheen sweep on hover — the only decorative layer. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/18 to-transparent transition-transform duration-700 ease-swift group-hover:translate-x-full peer-hover:translate-x-full"
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

type ButtonLinkProps = CommonProps & { to: string };

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  to,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(BASE, VARIANTS[variant], SIZES[size], 'group', className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/18 to-transparent transition-transform duration-700 ease-swift group-hover:translate-x-full"
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </Link>
  );
}
