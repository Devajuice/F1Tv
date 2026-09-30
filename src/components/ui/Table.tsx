import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/**
 * Table primitives.
 *
 * Every data page previously repeated a ~30-line `thStyle` object and its own
 * `<thead>`. These give one sticky-header treatment with consistent
 * alignment and a responsive overflow container.
 */

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function DataTable({ children, className }: TableProps) {
  return (
    <div
      className={cn(
        'edge-fade -mx-1 max-h-[70vh] overflow-auto rounded-sm px-1',
        className,
      )}
    >
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  );
}

export function Th({
  align = 'left',
  className,
  children,
  ...rest
}: { align?: 'left' | 'right' | 'center'; width?: string | number } & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'th px-3 py-2.5 first:pl-4 last:pr-4',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  align = 'left',
  className,
  children,
  ...rest
}: { align?: 'left' | 'right' | 'center' } & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 align-middle first:pl-4 last:pr-4',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

/** Table row with a hover wash and optional emphasis for the leader. */
export function Tr({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-white/[0.05] transition-colors duration-150 last:border-0 hover:bg-white/[0.025]',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

/** Position cell with special treatment for the top three. */
export function PositionCell({ position }: { position: string | number }) {
  const n = Number(position);
  const tone =
    n === 1
      ? 'text-sodium'
      : n === 2
        ? 'text-mist-200'
        : n === 3
          ? 'text-[#c2793a]'
          : 'text-mist-400';
  return (
    <span className={cn('num text-[13px] font-semibold', tone)}>
      {String(position).padStart(2, '0')}
    </span>
  );
}
