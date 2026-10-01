import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Hide the default close button (e.g. for confirmations). */
  hideClose?: boolean;
}

/**
 * Portal modal with focus trap, Escape handling, scroll lock and a blurred
 * backdrop. Used by the stream server picker and the shortcut help sheet.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  hideClose,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key !== 'Tab') return;

      // Simple focus trap.
      const focusables = document.querySelectorAll<HTMLElement>(
        '[data-modal] button, [data-modal] a[href], [data-modal] input, [data-modal] [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement as HTMLElement | null;

    window.addEventListener('keydown', onKeyDown, true);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-modal] button')?.focus();
    });

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-950/80 backdrop-blur-md"
      />
      <div
        data-modal
        role="dialog"
        aria-modal="true"
        className={cn(
          'animate-scale-in relative w-full max-w-lg overflow-hidden rounded-lg border border-line/12 bg-ink-850/98 shadow-[0_32px_80px_-24px_rgb(0_0_0/0.95)] backdrop-blur-2xl',
          className,
        )}
      >
        {(title || !hideClose) && (
          <div className="hairline-b flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h2 className="font-display text-lg font-bold tracking-tight text-mist-50">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-[12.5px] text-mist-400">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mt-1 -mr-1 rounded-sm p-1.5 text-mist-400 transition-colors hover:bg-veil/8 hover:text-mist-100"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
