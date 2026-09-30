import { useEffect } from 'react';

const BASE = 'F1TV';

/** Keeps document.title in sync with the active route. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : `${BASE} — Live Formula 1 Streaming & Timing`;
  }, [title]);
}
