import { useId, useRef } from 'react';
import { cn } from '../../lib/cn';

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  /** Optional trailing count or accent dot. */
  hint?: string;
}

interface TabsProps<T extends string> {
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Per-tab accent, used for the active underline. */
  accent?: string | ((value: T) => string);
  className?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

/**
 * Segmented tab bar with a sliding indicator.
 *
 * Replaces four hand-rolled tab implementations (Standings, Highlights,
 * Qualifying phase filter) that each had their own active-state styling.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  accent,
  className,
  size = 'md',
  'aria-label': ariaLabel,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const accentFor = (item: TabItem<T>) =>
    (typeof accent === 'function' ? accent(item.value) : accent) ??
    'var(--color-f1-red)';

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = items.findIndex((i) => i.value === value);
    if (index < 0) return;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    const target = items[next];
    if (!target) return;
    onChange(target.value);
    // Move DOM focus with selection for keyboard users.
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        'no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        const color = accentFor(item);
        return (
          <button
            key={item.value}
            id={`${id}-${item.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative shrink-0 rounded-sm font-semibold tracking-[0.06em] whitespace-nowrap uppercase transition-colors duration-250 ease-expo',
              size === 'sm'
                ? 'px-2.5 py-1.5 text-[10px]'
                : 'px-3.5 py-2 text-[11px]',
              active
                ? 'bg-veil/8 text-mist-50'
                : 'text-mist-400 hover:bg-veil/4 hover:text-mist-200',
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {item.hint && (
                <span className="num text-[9px] opacity-60">{item.hint}</span>
              )}
            </span>
            {/* Animated underline, shared style across all tab bars. */}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-1.5 -bottom-px h-0.5 origin-center rounded-full transition-transform duration-300 ease-expo',
                active ? 'scale-x-100' : 'scale-x-0',
              )}
              style={{ backgroundColor: color }}
            />
          </button>
        );
      })}
    </div>
  );
}
