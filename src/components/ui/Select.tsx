import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary line, e.g. circuit or date. */
  meta?: string;
  /** Leading element, e.g. a flag or status dot. */
  lead?: React.ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  /** Enables type-ahead / search filtering for long lists. */
  searchable?: boolean;
  align?: 'start' | 'end';
  emptyText?: string;
}

const MENU_WIDTH = 320;
const MAX_HEIGHT = 340;

/**
 * Accessible listbox in a portal.
 *
 * Four pages each shipped their own copy of this — a portal at
 * `position: fixed`, positioned from `getBoundingClientRect()`, with a
 * full-screen backdrop to escape stacking contexts. This is the single
 * implementation, now with proper keyboard support, search and scroll
 * containment.
 */
export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  className,
  buttonClassName,
  searchable = true,
  align = 'start',
  emptyText = 'No options',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);
  const id = useId();

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.meta?.toLowerCase().includes(q),
    );
  }, [options, query]);

  const position = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, MENU_WIDTH);
    let left = align === 'end' ? r.right - width : r.left;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    // Flip above the trigger when there isn't room below.
    const below = window.innerHeight - r.bottom;
    const top =
      below < MAX_HEIGHT + 16 && r.top > MAX_HEIGHT
        ? Math.max(8, r.top - MAX_HEIGHT - 8)
        : r.bottom + 6;
    setRect({ top, left });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    position();
    const onScroll = () => setOpen(false);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', position);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', position);
    };
  }, [open, position]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    setActiveIndex(Math.max(0, filtered.findIndex((o) => o.value === value)));
    if (searchable) {
      // Focus after paint so the popover is measured first.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const commit = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIndex]) commit(filtered[activeIndex]);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div className={cn('relative', className)} onKeyDown={onKeyDown}>
      {label && (
        <label
          htmlFor={id}
          className="eyebrow mb-2 block truncate"
        >
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-sm border border-white/10 bg-ink-800/80 px-3 py-2.5 text-left transition-all duration-250 ease-expo hover:border-white/20 hover:bg-ink-700/80',
          open && 'border-f1-red/50 bg-ink-700/90',
          buttonClassName,
        )}
      >
        {selected?.lead}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-mist-50">
            {selected?.label ?? placeholder}
          </span>
          {selected?.meta && (
            <span className="mt-0.5 block truncate font-mono text-[10px] text-mist-400">
              {selected.meta}
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-mist-400 transition-transform duration-300 ease-expo',
            open && 'rotate-180 text-mist-200',
          )}
        />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={label ?? placeholder}
            style={{
              position: 'fixed',
              top: rect.top,
              left: rect.left,
              width: MENU_WIDTH,
              maxHeight: MAX_HEIGHT,
              zIndex: 90,
            }}
            className="flex flex-col overflow-hidden rounded-md border border-white/12 bg-ink-850/98 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.95)] backdrop-blur-2xl"
          >
            {searchable && (
              <div className="hairline-b flex items-center gap-2 px-3 py-2.5">
                <Search size={13} className="shrink-0 text-mist-500" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder="Search…"
                  className="w-full bg-transparent text-[12px] text-mist-100 placeholder:text-mist-500 focus:outline-none"
                />
              </div>
            )}
            <div ref={listRef} className="no-scrollbar flex-1 overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-[12px] text-mist-500">
                  {emptyText}
                </p>
              )}
              {filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-active={isActive}
                    disabled={option.disabled}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(option)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xs px-2.5 py-2 text-left transition-colors duration-150',
                      option.disabled && 'pointer-events-none opacity-35',
                      isActive
                        ? 'bg-white/8 text-mist-50'
                        : 'text-mist-200 hover:bg-white/4',
                    )}
                  >
                    {option.lead}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium">
                        {option.label}
                      </span>
                      {option.meta && (
                        <span className="block truncate font-mono text-[10px] text-mist-500">
                          {option.meta}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check size={13} className="shrink-0 text-f1-red" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
