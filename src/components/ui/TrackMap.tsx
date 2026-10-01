import { useEffect, useState } from 'react';
import { loadCircuitPath } from '../../data/tracks';
import type { TrackPath } from '../../data/trackPaths';
import { cn } from '../../lib/cn';

/**
 * Circuit outline, stroked in `currentColor` so it follows the theme.
 *
 * The geometry is the upstream `minimal/black` SVG with its path extracted
 * (see `data/trackPaths`), which buys three things over a hotlinked PNG: no
 * third-party request, crisp at any device pixel ratio, and a track shape that
 * reads correctly on a light canvas. Because the module is loaded per layout,
 * a page that shows three circuits never pays for the other twenty-one.
 *
 * Falls back to the round monogram when the circuit is unknown or the chunk
 * fails to load, which is the same degradation the image had.
 */
export function TrackMap({
  circuit,
  round,
  className,
}: {
  circuit: string;
  round?: string | number;
  className?: string;
}) {
  const [path, setPath] = useState<TrackPath | null>(null);

  useEffect(() => {
    let live = true;
    // Guards against a stale fetch resolving after the row scrolls out and
    // another circuit has already been requested for this slot.
    loadCircuitPath(circuit).then((result) => {
      if (live) setPath(result);
    });
    return () => {
      live = false;
    };
  }, [circuit]);

  const label = round !== undefined ? `R${round}` : circuit.slice(0, 3).toUpperCase();

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line/8 bg-ink-800/60',
        className,
      )}
    >
      {path ? (
        <svg
          viewBox="0 0 500 500"
          role="img"
          aria-label={`${circuit} circuit layout`}
          className="size-full p-[14%] text-mist-400/85 transition-colors duration-300 hover:text-mist-200"
        >
          {/* Stroke width is left to scale with the viewBox: 20 units of 500
              lands at ~2.5px in a 64px tile, which is the weight the upstream
              PNGs used. `non-scaling-stroke` would pin it to 20 *screen* px. */}
          <path
            d={path.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={path.strokeWidth}
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span className="num text-[10px] font-semibold text-mist-500">{label}</span>
      )}
    </div>
  );
}