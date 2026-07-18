import { Link, useLocation } from 'react-router-dom';
import { Film, Trophy, ArrowLeft, Menu, X, Calendar, Flag, Newspaper, Timer, Users, Grid3x3, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSessions } from '../api/openf1';
import type { F1Session } from '../api/openf1';

interface NavLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface HeaderProps {
  links?: NavLink[];
  showBack?: boolean;
  backTo?: string;
  backLabel?: string;
}

function useLiveSession() {
  const [live, setLive] = useState<F1Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      getSessions().then((sessions) => {
        if (cancelled) return;
        const now = new Date();
        const current = sessions.find((s) => {
          if (s.is_cancelled) return false;
          const start = new Date(s.date_start);
          const end = new Date(s.date_end);
          return now >= start && now <= end;
        });
        setLive(current ?? null);
      }).catch(() => {});
    };
    check();
    const timer = setInterval(check, 60_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  return live;
}

export default function Header({ links, showBack, backTo = '/home', backLabel = 'Home' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const liveSession = useLiveSession();

  const defaultLinks: NavLink[] = [
    { to: '/highlights', label: 'Highlights', icon: <Film size={13} /> },
    { to: '/standings', label: 'Standings', icon: <Trophy size={13} /> },
    { to: '/calendar', label: 'Calendar', icon: <Calendar size={13} /> },
    { to: '/results', label: 'Results', icon: <Flag size={13} /> },
    { to: '/qualifying', label: 'Qualifying', icon: <Timer size={13} /> },
    { to: '/grid', label: 'Grid', icon: <Grid3x3 size={13} /> },
    { to: '/schedule', label: 'Schedule', icon: <Clock size={13} /> },
    { to: '/drivers', label: 'Drivers', icon: <Users size={13} /> },
    { to: '/news', label: 'News', icon: <Newspaper size={13} /> },
  ];

  const navLinks = links ?? defaultLinks;

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="slide-down" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 60 }}>
      <Link to="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 4, zIndex: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontStyle: 'italic' }}>F1</span>
        <span style={{ fontSize: 28, fontWeight: 900, color: '#e10600', fontStyle: 'italic' }}>TV</span>
        {liveSession && (
          <span className="pulse-dot" style={{
            width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
            display: 'inline-block', marginLeft: 4, verticalAlign: 'middle',
          }} title={`LIVE: ${liveSession.session_name} - ${liveSession.circuit_short_name}`} />
        )}
      </Link>

      {/* Desktop nav */}
      <div className="hidden-mobile" style={{ gap: 8, alignItems: 'center' }}>
        {showBack ? (
          <Link to={backTo} className="glass nav-link" style={{ padding: '6px 12px', borderRadius: 8, color: '#a3a3a3', textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
            <ArrowLeft size={13} /> {backLabel}
          </Link>
        ) : (
          navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className="glass nav-link"
                style={{
                  padding: '6px 12px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5,
                  color: active ? '#e10600' : '#a3a3a3',
                  background: active ? 'rgba(225,6,0,0.1)' : undefined,
                  borderColor: active ? 'rgba(225,6,0,0.25)' : undefined,
                }}
              >
                {link.icon} {link.label}
              </Link>
            );
          })
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="mobile-only"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#a3a3a3', cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="slide-in-down" style={{
          position: 'absolute', top: '100%', left: 16, right: 16, zIndex: 50,
          background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 8,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {liveSession && (
            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              LIVE: {liveSession.session_name}
            </div>
          )}
          {showBack ? (
            <Link
              to={backTo}
              onClick={() => setMobileOpen(false)}
              className="nav-link"
              style={{ padding: '10px 12px', borderRadius: 8, color: '#a3a3a3', textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <ArrowLeft size={14} /> {backLabel}
            </Link>
          ) : (
            navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="nav-link"
                  style={{
                    padding: '10px 12px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
                    color: active ? '#e10600' : '#a3a3a3',
                    background: active ? 'rgba(225,6,0,0.1)' : undefined,
                  }}
                >
                  {link.icon} {link.label}
                </Link>
              );
            })
          )}
        </div>
      )}
    </header>
  );
}
