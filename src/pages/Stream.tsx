import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Server, X, Wifi, WifiOff, Maximize, MonitorSmartphone, Keyboard } from 'lucide-react';
import { streamServers, type StreamServer } from '../data/streamServers';

export default function Stream() {
  const [activeServer, setActiveServer] = useState<StreamServer>(streamServers[0]);
  const [showServerSelector, setShowServerSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [serverStatuses] = useState<Record<number, boolean>>({});
  const [showControls, setShowControls] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (!showServerSelector && !showHelp) setShowControls(false);
    }, 3000);
  }, [showServerSelector, showHelp]);

  const requestPiP = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) { showToast('PiP not available'); return; }
      const video = doc.querySelector('video');
      if (video && document.pictureInPictureEnabled) {
        video.requestPictureInPicture().catch(() => showToast('PiP not available'));
      } else {
        showToast('PiP not available');
      }
    } catch {
      showToast('PiP not available (cross-origin)');
    }
  }, [showToast]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        if (showServerSelector) setShowServerSelector(false);
        if (showHelp) setShowHelp(false);
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
          if (!showServerSelector) setShowServerSelector(true);
          break;
        case 'h':
          setShowHelp((v) => !v);
          break;
        case 'f':
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          else document.documentElement.requestFullscreen().catch(() => {});
          break;
        case 'p':
          requestPiP();
          break;
      }
      resetControlsTimer();
    };

    const mouseMove = () => resetControlsTimer();

    window.addEventListener('keydown', handler);
    window.addEventListener('mousemove', mouseMove);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('mousemove', mouseMove);
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [showServerSelector, showHelp, resetControlsTimer, requestPiP]);

  const selectServer = (s: StreamServer) => {
    setActiveServer(s);
    setLoading(true);
    setShowServerSelector(false);
    showToast(`Switched to ${s.name}`);
  };

  const onlineCount = Object.values(serverStatuses).filter(Boolean).length;

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#fff',
          backdropFilter: 'blur(12px)',
        }} className="slide-in-down">
          {toast}
        </div>
      )}

      {showHelp && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 90,
          background: 'rgba(17,17,17,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: 16, backdropFilter: 'blur(20px)', minWidth: 200,
        }} className="scale-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Keyboard size={14} /> Shortcuts</h3>
            <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: 2 }}>
              <X size={14} />
            </button>
          </div>
          {[
            { key: 'S', desc: 'Switch server' },
            { key: 'F', desc: 'Fullscreen' },
            { key: 'P', desc: 'Picture-in-Picture' },
            { key: 'H', desc: 'Toggle help' },
            { key: 'Esc', desc: 'Close modals' },
          ].map(({ key, desc }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
              <kbd style={{ fontSize: 11, fontWeight: 700, color: '#e10600', background: 'rgba(225,6,0,0.1)', padding: '2px 6px', borderRadius: 4, minWidth: 28, textAlign: 'center' }}>{key}</kbd>
              <span style={{ fontSize: 12, color: '#a3a3a3' }}>{desc}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: 'relative', flex: 1, minHeight: '100vh' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050505', zIndex: 10 }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(225,6,0,0.2)', borderTopColor: '#e10600', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#737373', marginBottom: 4 }}>Connecting to stream...</p>
            <p style={{ fontSize: 12, color: '#525252' }}>{activeServer.name}</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={activeServer.id}
          src={activeServer.url}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: loading ? 'none' : 'block' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoading(false)}
        />

        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
            background: showControls ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' : 'transparent',
            padding: showControls ? '40px 16px 16px' : '0',
            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? 'auto' : 'none',
          }}
          onMouseMove={resetControlsTimer}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/home" className="glass" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, color: '#d4d4d4', textDecoration: 'none', fontSize: 13 }}>
              <ArrowLeft size={13} /> Home
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="glass"
                onClick={() => setShowHelp((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: '#737373', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                title="Keyboard shortcuts (H)"
              >
                <Keyboard size={14} />
              </button>
              <button
                className="glass"
                onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: '#737373', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                title="Fullscreen (F)"
              >
                <Maximize size={14} />
              </button>
              <button
                className="glass"
                onClick={requestPiP}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: '#737373', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                title="Picture-in-Picture (P)"
              >
                <MonitorSmartphone size={14} />
              </button>
              <button
                className="glass"
                onClick={() => setShowServerSelector(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, color: '#d4d4d4', fontSize: 13, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Server size={13} color="#e10600" />
                {activeServer.name}
                {onlineCount > 0 && (
                  <span style={{ fontSize: 10, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '1px 5px', borderRadius: 4 }}>
                    {onlineCount} live
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showServerSelector && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16 }}
          onClick={() => setShowServerSelector(false)}
        >
          <div
            className="scale-in"
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><Server size={18} /> Select Server</h2>
              <button
                onClick={() => setShowServerSelector(false)}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a3a3a3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {streamServers.map((server) => {
                const online = serverStatuses[server.id];
                const isActive = server.id === activeServer.id;
                return (
                  <button
                    key={server.id}
                    onClick={() => selectServer(server)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      padding: '14px 8px', borderRadius: 12, cursor: 'pointer',
                      background: isActive ? 'rgba(225,6,0,0.1)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid rgba(225,6,0,0.4)' : '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; } }}
                  >
                    <div style={{ position: 'relative' }}>
                      <Play size={18} color={isActive ? '#e10600' : '#737373'} fill={isActive ? '#e10600' : 'none'} />
                      {online !== undefined && (
                        <span style={{
                          position: 'absolute', top: -3, right: -3,
                          width: 8, height: 8, borderRadius: '50%',
                          background: online ? '#34d399' : '#ef4444',
                          border: '2px solid #111',
                        }} />
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{server.name}</span>
                    {online === false && <span style={{ fontSize: 9, color: '#f87171', display: 'flex', alignItems: 'center', gap: 3 }}><WifiOff size={9} /> Offline</span>}
                    {online === true && <span style={{ fontSize: 9, color: '#34d399', display: 'flex', alignItems: 'center', gap: 3 }}><Wifi size={9} /> Online</span>}
                  </button>
                );
              })}
            </div>
            <p style={{ marginTop: 16, fontSize: 10, color: '#525252', textAlign: 'center' }}>Press <kbd style={{ fontSize: 9, background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3, color: '#737373' }}>S</kbd> to open &middot; <kbd style={{ fontSize: 9, background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3, color: '#737373' }}>Esc</kbd> to close</p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
