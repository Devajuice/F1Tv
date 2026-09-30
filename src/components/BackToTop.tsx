import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

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
      className={`fixed right-4 bottom-32 z-70 flex size-10 items-center justify-center rounded-sm border border-white/12 bg-ink-800/90 text-mist-300 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl transition-all duration-350 ease-expo hover:border-f1-red/40 hover:text-mist-50 sm:right-6 lg:bottom-6 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <ArrowUp size={16} />
    </button>
  );
}
