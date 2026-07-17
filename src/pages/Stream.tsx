import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Server, X, Wifi, WifiOff } from 'lucide-react';
import { streamServers, type StreamServer } from '../data/streamServers';

export default function Stream() {
  const [activeServer, setActiveServer] = useState<StreamServer>(streamServers[0]);
  const [showServerSelector, setShowServerSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [serverStatuses, setServerStatuses] = useState<Record<number, boolean>>({});

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }, []);

  useEffect(() => {
    const check = async () => {
      for (const s of streamServers) {
        try {
          await fetch(s.url, { mode: 'no-cors', signal: AbortSignal.timeout(5000) });
          setServerStatuses((p) => ({ ...p, [s.id]: true }));
        } catch {
          setServerStatuses((p) => ({ ...p, [s.id]: false }));
        }
      }
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showServerSelector) setShowServerSelector(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showServerSelector]);

  const selectServer = (s: StreamServer) => {
    setActiveServer(s);
    setLoading(true);
    setShowServerSelector(false);
    showToast(`Switched to ${s.name}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column' }}>
      {/* Toast */}
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

      {/* Stream Player */}
      <div style={{ position: 'relative', flex: 1, minHeight: 'calc(100vh - 56px)' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050505', zIndex: 10 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e10600', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: '#525252' }}>Connecting to Stream...</p>
          </div>
        )}
        <iframe
          key={activeServer.id}
          src={activeServer.url}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', display: loading ? 'none' : 'block' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoading(false)}
        />

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
          <Link to="/home" className="glass" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, color: '#d4d4d4', textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={13} /> Home
          </Link>
          <button
            className="glass"
            onClick={() => setShowServerSelector(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, color: '#d4d4d4', fontSize: 13, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Server size={13} color="#e10600" />
            {activeServer.name}
          </button>
        </div>
      </div>

      {/* Server Modal */}
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
                style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a3a3a3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
            <p style={{ marginTop: 16, fontSize: 10, color: '#404040', textAlign: 'center' }}>Press Esc to close</p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
