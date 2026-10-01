/**
 * Applies the saved theme before first paint.
 *
 * This lives in its own file rather than inline in index.html because the CSP in
 * vercel.json sets `script-src 'self'` with no `unsafe-inline`. An inline script
 * would need its exact bytes hashed into the policy, and that hash breaks
 * silently the moment the script is reformatted — it breaks at runtime, in one
 * browser, with no build-time error. An external script is allowed by 'self',
 * so there is no hash to keep in sync.
 *
 * Loaded with a plain blocking <script src> in <head>: not a module, not
 * deferred, not async, so it still runs before the body paints and a light-theme
 * reload cannot flash dark.
 *
 * Keep the logic below in sync with THEME_BOOTSTRAP in src/context/ThemeContext.tsx,
 * which documents the same decision for reference.
 */
(function () {
  try {
    var p = localStorage.getItem('f1tv:theme');
    if (p !== 'light' && p !== 'dark') {
      p = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.dataset.theme = p;
    document.documentElement.style.colorScheme = p;
  } catch {
    document.documentElement.dataset.theme = 'dark';
  }
})();