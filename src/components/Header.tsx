import { Link, useLocation } from 'react-router-dom';
import { Film, Trophy, ArrowLeft, Menu, X, Calendar, Flag, Newspaper, Timer, Users, Grid3x3, Clock, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessions } from '../api/openf1';
import type { F1Session } from '../api/openf1';

interface NavLink {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

interface HeaderProps {
  groups?: NavGroup[];
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

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrolled;
}

export default function Header({ groups, showBack, backTo = '/home', backLabel = 'Home' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const liveSession = useLiveSession();
  const scrolled = useScrolled();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  const defaultGroups: NavGroup[] = [
    {
      label: 'Race',
      links: [
        { to: '/highlights', label: 'Highlights', icon: <Film size={13} /> },
        { to: '/calendar', label: 'Calendar', icon: <Calendar size={13} /> },
        { to: '/schedule', label: 'Schedule', icon: <Clock size={13} /> },
      ],
    },
    {
      label: 'Results',
      links: [
        { to: '/standings', label: 'Standings', icon: <Trophy size={13} /> },
        { to: '/results', label: 'Results', icon: <Flag size={13} /> },
        { to: '/qualifying', label: 'Qualifying', icon: <Timer size={13} /> },
        { to: '/grid', label: 'Grid', icon: <Grid3x3 size={13} /> },
      ],
    },
    {
      label: 'Info',
      links: [
        { to: '/drivers', label: 'Drivers', icon: <Users size={13} /> },
        { to: '/news', label: 'News', icon: <Newspaper size={13} /> },
      ],
    },
  ];

  const navGroups = groups ?? defaultGroups;

  const isActive = (path: string) => location.pathname === path;

  const isGroupActive = (group: NavGroup) => group.links.some((l) => isActive(l.to));

  const handleDropdownEnter = useCallback((label: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpenDropdown(label);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setOpenDropdown(null), 150);
  }, []);

  useEffect(() => {
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, []);

  const liveBadge = liveSession && (
    <div className="mobile-group mobile-group-link" style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
      LIVE: {liveSession.session_name}
    </div>
  );

  return (
    <header className={`header-bar slide-down${scrolled ? ' header-scrolled' : ''}`} style={{ padding: '12px 16px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/home" className="logo-link" style={{ textDecoration: 'none', zIndex: 10 }}>
          <span className="logo-f1" style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic' }}>F1</span>
          <span className="logo-tv" style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic' }}>TV</span>
          {liveSession && (
            <span className="pulse-dot" style={{
              width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
              display: 'inline-block', marginLeft: 4, verticalAlign: 'middle',
            }} title={`LIVE: ${liveSession.session_name} - ${liveSession.circuit_short_name}`} />
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden-mobile" style={{ gap: 4, alignItems: 'center' }}>
          {showBack ? (
            <Link to={backTo} className="glass nav-link" style={{ padding: '6px 12px', borderRadius: 8, color: '#a3a3a3', textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
              <ArrowLeft size={13} /> {backLabel}
            </Link>
          ) : (
            navGroups.map((group) => {
              const active = isGroupActive(group);
              const isOpen = openDropdown === group.label;
              return (
                <div
                  key={group.label}
                  className={`nav-dropdown${isOpen ? ' open' : ''}`}
                  onMouseEnter={() => handleDropdownEnter(group.label)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <button
                    className="glass nav-dropdown-trigger"
                    style={{
                      padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4,
                      color: active ? '#e10600' : '#a3a3a3',
                      background: active ? 'rgba(225,6,0,0.1)' : undefined,
                    }}
                  >
                    {group.label}
                    <ChevronDown size={12} className="dropdown-chevron" />
                  </button>
                  <div className="nav-dropdown-panel" style={{ left: 0, transform: isOpen ? 'translateY(0)' : 'translateY(-4px)' }}>
                    {group.links.map((link) => {
                      const linkActive = isActive(link.to);
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          className={`glass nav-link${linkActive ? ' nav-link-active' : ''}`}
                          style={{
                            padding: '8px 12px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
                            color: linkActive ? '#e10600' : '#a3a3a3',
                            background: linkActive ? 'rgba(225,6,0,0.1)' : undefined,
                          }}
                        >
                          {link.icon} {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
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
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <>
          <div
            className="mobile-only mobile-backdrop mobile-backdrop-enter"
            onClick={() => setMobileOpen(false)}
          />
          <div className="mobile-only mobile-menu-enter" style={{
            position: 'fixed', top: 60, left: 12, right: 12, zIndex: 50,
            background: 'rgba(17,17,17,0.97)', backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 6,
            display: 'flex', flexDirection: 'column', gap: 2,
            maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
          }}>
            {liveBadge}

            {navGroups.map((group) => (
              <div key={group.label} className="mobile-group" style={{ padding: '2px 0' }}>
                <div className="mobile-group-label">{group.label}</div>
                {group.links.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`nav-link mobile-group-link${active ? ' nav-link-active' : ''}`}
                      style={{
                        padding: '10px 12px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
                        color: active ? '#e10600' : '#a3a3a3',
                        background: active ? 'rgba(225,6,0,0.1)' : undefined,
                      }}
                    >
                      {link.icon} {link.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </header>
  );
}
