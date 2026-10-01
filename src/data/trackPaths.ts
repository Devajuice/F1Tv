/**
 * Circuit path geometry, split one module per layout so a page only pays for
 * the circuits it actually renders.
 *
 * Source: https://github.com/julesr0y/f1-circuits-svg (CC-BY-4.0), vendored
 * under `public/tracks/`. Each file is the upstream `minimal/black` SVG with
 * the `<path d>` and stroke width extracted so the outline can be stroked in
 * `currentColor` and therefore follow the active theme.
 *
 * Upstream ships a 500x500 coordinate space with no `viewBox`; the `viewBox`
 * is applied at the call site instead so the same geometry scales to any tile.
 */

export interface TrackPath {
  /** SVG path data in a 500x500 viewBox. */
  d: string;
  /** Upstream stroke width in the same units. */
  strokeWidth: number;
}

const LOADERS: Record<string, () => Promise<TrackPath>> = {
  'austin-1': () =>
    import('./trackPaths/austin-1.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'bahrain-1': () =>
    import('./trackPaths/bahrain-1.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'baku-1': () =>
    import('./trackPaths/baku-1.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'catalunya-6': () =>
    import('./trackPaths/catalunya-6.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'hungaroring-3': () =>
    import('./trackPaths/hungaroring-3.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'imola-3': () =>
    import('./trackPaths/imola-3.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'interlagos-2': () =>
    import('./trackPaths/interlagos-2.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'jeddah-1': () =>
    import('./trackPaths/jeddah-1.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'las-vegas-1': () =>
    import('./trackPaths/las-vegas-1.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'lusail-1': () =>
    import('./trackPaths/lusail-1.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'madring-1': () =>
    import('./trackPaths/madring-1.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'marina-bay-4': () =>
    import('./trackPaths/marina-bay-4.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'melbourne-2': () =>
    import('./trackPaths/melbourne-2.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'mexico-city-3': () =>
    import('./trackPaths/mexico-city-3.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'miami-1': () =>
    import('./trackPaths/miami-1.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'monaco-6': () =>
    import('./trackPaths/monaco-6.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'monza-7': () =>
    import('./trackPaths/monza-7.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'shanghai-1': () =>
    import('./trackPaths/shanghai-1.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'silverstone-8': () =>
    import('./trackPaths/silverstone-8.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'spa-francorchamps-4': () =>
    import('./trackPaths/spa-francorchamps-4.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'spielberg-3': () =>
    import('./trackPaths/spielberg-3.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'suzuka-2': () =>
    import('./trackPaths/suzuka-2.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'yas-marina-2': () =>
    import('./trackPaths/yas-marina-2.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
  'zandvoort-5': () =>
    import('./trackPaths/zandvoort-5.ts').then((m) => ({ d: m.PATH, strokeWidth: m.STROKE_WIDTH })),
};

const CACHE = new Map<string, TrackPath>();

/**
 * Load a layout's geometry. Repeated calls for the same layout share one
 * in-flight import, so a calendar listing the same circuit twice is free.
 */
export function loadTrackPath(layoutId: string): Promise<TrackPath> {
  const cached = CACHE.get(layoutId);
  if (cached) return Promise.resolve(cached);

  const loader = LOADERS[layoutId];
  if (!loader) return Promise.reject(new Error(`Unknown track layout: ${layoutId}`));

  return loader().then((path) => {
    CACHE.set(layoutId, path);
    return path;
  });
}
