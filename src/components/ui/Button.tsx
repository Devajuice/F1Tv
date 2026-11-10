import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'live';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.08em] whitespace-nowrap transition-all duration-200 ease-expo disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-f1-red/50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-mist-50 text-ink-950 shadow-[0_10px_24px_-16px_rgb(0_0_0/0.5)] hover:-translate-y-px hover:bg-mist-100',
  secondary:
    'border border-line/15 bg-ink-850/40 text-mist-100 backdrop-blur-sm hover:-translate-y-px hover:border-line/30 hover:bg-ink-800/60',
  ghost: 'text-mist-300 hover:bg-veil/6 hover:text-mist-50',
  live:
    'bg-live text-white shadow-[0_14px_30px_-16px_var(--pal-live)] hover:-translate-y-px hover:brightness-110',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[10px]',
  md: 'h-11 px-5 text-[11px]',
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
