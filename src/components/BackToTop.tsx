import { useEffect, useState } from 'react';

/** Floating scroll-to-top control, revealed after the first screenful. */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed right-4 bottom-32 z-70 flex h-9 items-center justify-center rounded-sm border border-line/12 bg-ink-800 px-3 text-[10px] font-semibold tracking-[0.08em] text-mist-300 uppercase transition-all duration-300 ease-expo hover:border-line/30 hover:text-mist-50 sm:right-6 lg:bottom-6 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      Top
    </button>
  );
}
