import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Keyboard,
  Maximize,
  MonitorSmartphone,
  Play,
  RefreshCw,
  Server,
  SkipForward,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { streamServers, type StreamServer } from '../data/streamServers';
import { getSessionMeta, isRaceSession } from '../data/sessions';
import { useSession } from '../context/SessionContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Modal } from '../components/ui/Modal';
import { LiveDot } from '../components/ui/Badge';
import { cn } from '../lib/cn';

const STORAGE_KEY = 'f1tv_stream_server';
/** How long to wait for a server to answer before calling it unreachable. */
const PROBE_TIMEOUT = 6000;
/** If the player never fires `load`, offer a retry instead of spinning forever. */
const LOAD_TIMEOUT = 12_000;
const CONTROLS_TIMEOUT = 3000;

type Health = 'checking' | 'reachable' | 'unreachable';

export default function Stream() {
  useDocumentTitle('Watch Live');
  const { live, current, next } = useSession();

  const [active, setActive] = useState<StreamServer>(() => {
    const saved =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY)
        : null;
    // `streamServers` is a module-level const with a non-empty first entry, but
    // noUncheckedIndexedAccess cannot prove it, and the empty-list case would
    // hand back undefined and crash on `active.id` further down.
    const fallback = streamServers[0];
    if (!fallback) throw new Error('streamServers is empty');
    return streamServers.find((s) => String(s.id) === saved) ?? fallback;
  });

  const [loading, setLoading] = useState(true);
  const [stalled, setStalled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showServers, setShowServers] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [health, setHealth] = useState<Record<number, Health>>({});

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------------------------------------------------------------
     Reachability probe.
     The stream hosts are third-party and send no CORS headers, so a normal
     `fetch` fails on the response even when the stream is up. A no-cors
     request still resolves opaquely for a reachable host and rejects for a
     DNS/TLS/network failure, which is exactly the signal we want.
     Previously `serverStatuses` was initialised to `{}` and never filled in,
     so the "N live" badge and the online/offline dots never rendered.
     --------------------------------------------------------------------- */
  const probe = useCallback(async (servers: StreamServer[]) => {
    setHealth(Object.fromEntries(servers.map((s) => [s.id, 'checking' as Health])));

    await Promise.all(
      servers.map(async (server) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
        let result: Health = 'unreachable';
        try {
          await fetch(server.url, {
            mode: 'no-cors',
            signal: controller.signal,
            cache: 'no-store',
          });
          result = 'reachable';
        } catch {
          result = 'unreachable';
        } finally {
          clearTimeout(timer);
        }
        setHealth((prev) => ({ ...prev, [server.id]: result }));
      }),
    );
  }, []);

  useEffect(() => {
    void probe(streamServers);
  }, [probe]);

  const onlineCount = useMemo(
    () => Object.values(health).filter((h) => h === 'reachable').length,
    [health],
  );

  /* --------------------------- Player state --------------------------- */
  const selectServer = useCallback(
    (server: StreamServer) => {
      setActive(server);
      setLoading(true);
      setStalled(false);
      setShowServers(false);
      try {
        localStorage.setItem(STORAGE_KEY, String(server.id));
      } catch {
        /* private mode */
      }
      setToast(`Switched to ${server.name}`);
    },
    [],
  );

  const goToNextServer = useCallback(() => {
    const index = streamServers.findIndex((s) => s.id === active.id);
    const nextServer = streamServers[(index + 1) % streamServers.length];
    if (nextServer) selectServer(nextServer);
  }, [active.id, selectServer]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), CONTROLS_TIMEOUT);
  }, []);

  /* A frame that never fires `load` used to leave the spinner up forever. */
  useEffect(() => {
    setLoading(true);
    setStalled(false);
    if (loadTimer.current) clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => setStalled(true), LOAD_TIMEOUT);
    return () => {
      if (loadTimer.current) clearTimeout(loadTimer.current);
    };
  }, [active.id]);

  useEffect(
    () => () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      if (loadTimer.current) clearTimeout(loadTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  /* --------------------------- Player actions -------------------------- */
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void document.documentElement.requestFullscreen().catch(() => {
        showToast('Fullscreen blocked by the browser');
      });
    }
  }, [showToast]);

  /**
   * Cross-origin frames block DOM access, so picture-in-picture only works
   * when the host happens to allow it. Previously the failure modes were
   * silent; now each one says why.
   */
  const requestPiP = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
      const video = doc?.querySelector('video');
      if (!video) throw new Error('no video');
      if (!document.pictureInPictureEnabled) throw new Error('unsupported');
      void video.requestPictureInPicture().catch(() => {
        showToast('PiP refused by the stream host');
      });
    } catch {
      showToast('PiP unavailable — the stream host is cross-origin');
    }
  }, [showToast]);

  /* ------------------------- Keyboard shortcuts ------------------------ */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 's':
          setShowServers(true);
          break;
        case 'h':
          setShowHelp((v) => !v);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'p':
          requestPiP();
          break;
        case 'n':
          goToNextServer();
          break;
        default:
          return;
      }
      resetControlsTimer();
    };

    const onMouseMove = () => resetControlsTimer();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [goToNextServer, requestPiP, resetControlsTimer, toggleFullscreen]);

  const session = live ?? current;
  const sessionMeta = session ? getSessionMeta(session.session_name, session.session_type) : null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink-950">
      {/* ---------------------------- Player ---------------------------- */}
      <iframe
        ref={iframeRef}
        key={active.id}
        src={active.url}
        title={`${active.name} live stream`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => {
          setLoading(false);
          setStalled(false);
          if (loadTimer.current) clearTimeout(loadTimer.current);
        }}
        className={cn(
          'absolute inset-0 size-full border-0 transition-opacity duration-500',
          loading || stalled ? 'opacity-0' : 'opacity-100',
        )}
      />

      {/* Vignette so the overlay controls stay readable over bright footage */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink-950/85 via-transparent to-ink-950/60"
      />

      {/* ------------------------- Loading state -------------------------- */}
      {loading && !stalled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-ink-950">
          <span
            aria-hidden
            className="size-12 animate-spin rounded-full border-[3px] border-f1-red/20 border-t-f1-red"
          />
          <div className="text-center">
            <p className="font-display text-sm font-bold tracking-[0.1em] text-mist-200 uppercase">
              Connecting
            </p>
            <p className="mt-1.5 font-mono text-[11px] text-mist-500">{active.name}</p>
          </div>
        </div>
      )}

      {/* -------------------------- Stalled state ------------------------- */}
      {stalled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-sodium/40 bg-sodium/10 text-sodium">
            <AlertTriangle size={20} />
          </span>
          <div>
            <p className="font-display text-base font-bold text-mist-50">
              {active.name} isn't responding
            </p>
            <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-mist-400">
              This server took too long to start. Public stream hosts go down
              often — try the next one, or pick a different server.
            </p>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <ControlButton onClick={goToNextServer} icon={SkipForward} label="Next server" primary />
            <ControlButton onClick={() => setShowServers(true)} icon={Server} label="All servers" />
            <ControlButton onClick={selectServer.bind(null, active)} icon={RefreshCw} label="Retry" />
          </div>
        </div>
      )}

      {/* ------------------------- Toast message ------------------------- */}
      {toast && (
        <div
          role="status"
          className="animate-slide-down pointer-events-none fixed top-5 left-1/2 z-60 -translate-x-1/2 rounded-xs border border-line/12 bg-ink-900/95 px-3.5 py-2 font-mono text-[11px] text-mist-100 backdrop-blur-xl"
        >
          {toast}
        </div>
      )}

      {/* ------------------------ Top-left overlay ----------------------- */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 transition-opacity duration-400 sm:p-4',
          showControls ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <OverlayLink to="/home" icon={ArrowLeft} label="Back to dashboard" />

          {session && sessionMeta ? (
            <div className="flex items-center gap-2.5 rounded-xs border border-line/10 bg-ink-900/80 px-3 py-1.5 backdrop-blur-xl">
              {isRaceSession(session.session_name, session.session_type) && (
                <LiveDot label="On air" />
              )}
              <span className="min-w-0">
                <span className="block truncate text-[11.5px] leading-tight font-semibold text-mist-100">
                  {sessionMeta.label}
                </span>
                <span className="block truncate font-mono text-[9.5px] text-mist-500">
                  {session.circuit_short_name || session.location}
                </span>
              </span>
            </div>
          ) : next ? (
            <div className="hidden rounded-xs border border-line/10 bg-ink-900/80 px-3 py-1.5 backdrop-blur-xl sm:block">
              <span className="font-mono text-[9.5px] text-mist-500">Up next</span>
              <span className="ml-2 text-[11.5px] font-semibold text-mist-200">
                {getSessionMeta(next.session_name, next.session_type).label}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ----------------------- Bottom control bar ---------------------- */}
      <div
        onMouseMove={resetControlsTimer}
        className={cn(
          'absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-3 bg-linear-to-t from-ink-950/90 to-transparent p-3 pt-12 transition-opacity duration-400 sm:p-4 sm:pt-16',
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <OverlayLink to="/home" icon={ArrowLeft} label="Back to dashboard" className="sm:hidden" />
          <div className="hidden sm:block">
            <p className="font-mono text-[9px] tracking-[0.18em] text-mist-600 uppercase">
              Stream source
            </p>
            <p className="text-[12px] font-semibold text-mist-200">{active.name}</p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <OverlayIconButton
            icon={SkipForward}
            onClick={goToNextServer}
            aria-label="Next server"
            title="Next server (N)"
          />
          <OverlayIconButton
            icon={MonitorSmartphone}
            onClick={requestPiP}
            aria-label="Picture in picture"
            title="Picture-in-picture (P)"
          />
          <OverlayIconButton
            icon={Maximize}
            onClick={toggleFullscreen}
            aria-label="Fullscreen"
            title="Fullscreen (F)"
          />
          <OverlayIconButton
            icon={Keyboard}
            onClick={() => setShowHelp(true)}
            aria-label="Keyboard shortcuts"
            title="Shortcuts (H)"
          />
          <button
            type="button"
            onClick={() => setShowServers(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xs border border-line/12 bg-ink-900/85 px-3 font-mono text-[10.5px] font-semibold tracking-[0.08em] text-mist-100 uppercase backdrop-blur-xl transition-colors hover:border-line/25 hover:bg-ink-850/90"
            title="Switch server (S)"
          >
            <Server size={13} className="text-f1-red" />
            <span className="hidden sm:inline">{active.name}</span>
            <span className="sm:hidden">Servers</span>
            {onlineCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-xs bg-turf/12 px-1.5 py-0.5 text-[9px] text-turf">
                <Wifi size={8} />
                {onlineCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------- Server picker ------------------------- */}
      <Modal
        open={showServers}
        onClose={() => setShowServers(false)}
        title="Select a server"
        description={
          onlineCount > 0
            ? `${onlineCount} of ${streamServers.length} responding right now.`
            : 'Public stream hosts are checked for reachability, not for picture quality.'
        }
        className="max-w-xl"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {streamServers.map((server) => {
            const state = health[server.id] ?? 'checking';
            const isActive = server.id === active.id;
            return (
              <button
                key={server.id}
                type="button"
                onClick={() => selectServer(server)}
                aria-pressed={isActive}
                className={cn(
                  'group relative flex flex-col items-center gap-2 rounded-sm border px-3 py-4 transition-colors',
                  isActive
                    ? 'border-f1-red/45 bg-f1-red/10'
                    : 'border-line/8 bg-veil/[0.02] hover:border-line/20 hover:bg-veil/[0.05]',
                )}
              >
                <span className="relative">
                  <Play
                    size={17}
                    className={isActive ? 'text-f1-red' : 'text-mist-500'}
                    fill={isActive ? 'currentColor' : 'none'}
                  />
                  <span
                    className={cn(
                      'absolute -top-0.5 -right-1 size-2.5 rounded-full border-2 border-ink-900',
                      state === 'reachable' && 'bg-turf',
                      state === 'unreachable' && 'bg-f1-red',
                      state === 'checking' && 'animate-pulse bg-mist-500',
                    )}
                  />
                </span>
                <span className="text-[11.5px] font-semibold text-mist-100">
                  {server.name}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.08em] uppercase',
                    state === 'reachable' && 'text-turf',
                    state === 'unreachable' && 'text-f1-red-bright',
                    state === 'checking' && 'text-mist-600',
                  )}
                >
                  {state === 'reachable' && <Wifi size={9} />}
                  {state === 'unreachable' && <WifiOff size={9} />}
                  {state}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void probe(streamServers)}
          className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-mist-500 uppercase transition-colors hover:text-mist-200"
        >
          <RefreshCw size={11} />
          Re-check all servers
        </button>
      </Modal>

      {/* --------------------------- Shortcuts --------------------------- */}
      <Modal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title="Keyboard shortcuts"
        className="max-w-sm"
      >
        <dl className="flex flex-col gap-2.5">
          {[
            { key: 'S', desc: 'Open the server picker' },
            { key: 'N', desc: 'Jump to the next server' },
            { key: 'F', desc: 'Toggle fullscreen' },
            { key: 'P', desc: 'Request picture-in-picture' },
            { key: 'H', desc: 'Toggle this panel' },
            { key: 'Esc', desc: 'Close a panel' },
          ].map(({ key, desc }) => (
            <div key={key} className="flex items-center gap-3">
              <dt>
                <kbd className="num inline-flex h-6 min-w-8 items-center justify-center rounded-xs border border-f1-red/30 bg-f1-red/10 px-1.5 font-mono text-[10px] font-bold text-f1-red-bright">
                  {key}
                </kbd>
              </dt>
              <dd className="text-[12.5px] text-mist-300">{desc}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 border-t border-line/[0.06] pt-3 text-[11px] leading-relaxed text-mist-500">
          Picture-in-picture needs permission from the stream host's own player.
          If it refuses, use your browser's own picture-in-picture on the video.
        </p>
      </Modal>
    </div>
  );
}

/* ---------------------------------------------------------------------- */

/** Small frosted square used for the corner player actions. */
function OverlayIconButton({
  icon: Icon,
  className,
  ...rest
}: { icon: typeof Play } & Omit<ComponentProps<'button'>, 'children'>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-xs border border-line/12 bg-ink-900/85 text-mist-100 backdrop-blur-xl transition-colors hover:border-line/25 hover:bg-ink-850/90',
        className,
      )}
      {...rest}
    >
      <Icon size={14} />
    </button>
  );
}

/** The same control, but navigating rather than acting. */
function OverlayLink({
  to,
  icon: Icon,
  label,
  className,
}: {
  to: string;
  icon: typeof Play;
  label: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-xs border border-line/12 bg-ink-900/85 text-mist-100 backdrop-blur-xl transition-colors hover:border-line/25 hover:bg-ink-850/90',
        className,
      )}
    >
      <Icon size={14} />
    </Link>
  );
}

function ControlButton({
  icon: Icon,
  label,
  primary,
  ...rest
}: {
  icon: typeof Play;
  label: string;
  primary?: boolean;
} & Omit<ComponentProps<'button'>, 'children'>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-xs border px-3 font-mono text-[10.5px] font-semibold tracking-[0.06em] uppercase backdrop-blur-xl transition-colors',
        primary
          ? 'border-f1-red/50 bg-f1-red/20 text-mist-50 hover:bg-f1-red/30'
          : 'border-line/12 bg-ink-900/85 text-mist-100 hover:border-line/25 hover:bg-ink-850/90',
      )}
      {...rest}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
