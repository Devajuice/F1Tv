import { cn } from '../lib/cn';

/** Shown while a lazily-loaded route chunk is in flight. */
export default function RouteFallback({ immersive = false }: { immersive?: boolean }) {
  if (immersive) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col gap-[4px] skew-x-[-18deg]">
            <span className="h-1 w-16 rounded-[1px] bg-f1-red" />
            <span className="h-1 w-11 rounded-[1px] bg-mist-200" />
            <span className="h-1 w-7 rounded-[1px] bg-mist-600" />
          </div>
          <span className="font-mono text-[10px] tracking-[0.2em] text-mist-500 uppercase">
            Buffering
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8')}>
      <div className="shimmer mb-3 h-2.5 w-24 rounded-sm" />
      <div className="shimmer mb-10 h-9 w-72 max-w-full rounded-sm" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="shimmer h-24 rounded-lg" />
        ))}
      </div>
      <div className="shimmer mt-4 h-64 rounded-lg" />
    </div>
  );
}
