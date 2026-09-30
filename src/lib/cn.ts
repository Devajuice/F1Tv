import clsx, { type ClassValue } from 'clsx';

/** Conditional class names. Thin wrapper so we import from one place. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
