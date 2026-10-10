import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'live';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-sm font-semibold uppercase tracking-[0.08em] whitespace-nowrap transition-colors duration-200 ease-swift disabled:pointer-events-none disabled:opacity-40';

const VARIANTS: Record<ButtonVariant, string> = {
  // Neutral, high-contrast primary: the chrome stays quiet, the data reads.
  primary: 'bg-mist-50 text-ink-950 hover:bg-mist-100',
  secondary:
    'border border-line/15 text-mist-200 hover:border-line/30 hover:text-mist-50',
  ghost: 'text-mist-300 hover:bg-veil/6 hover:text-mist-50',
  live: 'bg-live text-white hover:brightness-110',
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
      {children}
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
    <Link to={to} className={cn(BASE, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  );
}
