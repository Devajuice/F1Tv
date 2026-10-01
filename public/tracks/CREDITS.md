# Circuit map artwork

The circuit outlines in this directory and in `src/data/trackPaths/` are derived
from:

**f1-circuits-svg** — <https://github.com/julesr0y/f1-circuits-svg>
by ROY Jules (julesr0y), licensed **CC-BY-4.0**.
Pinned to tag `v2026.3.0`, `circuits/minimal/black/*.svg`.

## What was changed

The upstream files were not modified. Their `<path d>` and `stroke-width` were
extracted into `src/data/trackPaths/<layout>.ts` so the outline can be stroked
with `currentColor` and follow the active light/dark theme, and rendered inline
at any size without an image request. The `.svg` files here are the untouched
upstream copies, kept for the offline service-worker cache and as the
provenance record.

Upstream ships a 500x500 coordinate space with no `viewBox`; the `viewBox` is
applied at the call site in `src/components/ui/TrackMap.tsx`.

## Layout ids

`bahrain-1`, `melbourne-2`, `shanghai-1`, `suzuka-2`, `miami-1`, `imola-3`,
`monaco-6`, `catalunya-6`, `spielberg-3`, `silverstone-8`,
`spa-francorchamps-4`, `hungaroring-3`, `zandvoort-5`, `monza-7`, `baku-1`,
`marina-bay-4`, `austin-1`, `mexico-city-3`, `interlagos-2`, `lusail-1`,
`yas-marina-2`, `las-vegas-1`, `jeddah-1`, `madring-1`.

## Note

F1TV is an independent, unofficial project. It is not associated with,
endorsed by, or affiliated with Formula One Licensing BV, the FIA, or any
Formula 1 circuit. Circuit geometry is factual data, but no claim of
trademark ownership is made over any circuit name or logo.