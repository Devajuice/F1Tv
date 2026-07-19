import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, MapPin, Clock, Thermometer, Droplets, Wind, CloudRain, ChevronRight, ChevronDown, Trophy, Calendar, Flag } from 'lucide-react';
import type { F1Session, F1Weather } from '../api/openf1';
import { getSessions, getFallbackSessions, getLatestWeather, getNextRaceSession, getWeatherForSession, getSessionStatus, getSessionLabel, getSessionProgress } from '../api/openf1';
import { getDriverStandings, getConstructorStandings } from '../api/f1Api';
import type { DriverStanding, ConstructorStanding } from '../api/f1Api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

export default function Home() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<F1Session[]>([]);
  const [weather, setWeather] = useState<F1Weather | null>(null);
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [showStandings, setShowStandings] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const loadWeather = (allSessions: F1Session[]) => {
      const nextRace = getNextRaceSession(allSessions);
      if (nextRace && getSessionStatus(nextRace) !== 'upcoming') {
        getWeatherForSession(nextRace.session_key).then((w) => {
          if (w) { setWeather(w); return; }
          getLatestWeather().then(setWeather).catch(() => {});
        }).catch(() => {
          getLatestWeather().then(setWeather).catch(() => {});
        });
      } else {
        getLatestWeather().then(setWeather).catch(() => {});
      }
    };

    getSessions().then((all) => {
      const loadFromSessions = (sessions: F1Session[]) => {
        const upcoming = sessions.filter((s) => !s.is_cancelled);
        setSessions(upcoming);
        loadWeather(sessions);
        interval = setInterval(() => {
          getSessions().then((s) => s.length > 0 ? loadWeather(s) : loadWeather(all)).catch(() => {});
        }, 180_000);
      };

      if (all.length > 0) {
        loadFromSessions(all);
      } else {
        getFallbackSessions().then(loadFromSessions).catch(() => {});
      }
    }).catch(() => {});

    getDriverStandings().then((s) => setDrivers(s.slice(0, 5))).catch(console.error);
    getConstructorStandings().then((s) => setConstructors(s.slice(0, 5))).catch(console.error);

    const standingsInterval = setInterval(() => {
      getDriverStandings().then((s) => setDrivers(s.slice(0, 5))).catch(() => {});
      getConstructorStandings().then((s) => setConstructors(s.slice(0, 5))).catch(() => {});
    }, 180_000);

    return () => { if (interval) clearInterval(interval); clearInterval(standingsInterval); };
  }, []);

  const progress = getSessionProgress(sessions);

  return (
    <PageWrapper>
      <Header />

      {/* Weather Bar */}
      {progress?.current ? (
        <div style={{ maxWidth: 1100, margin: '0 auto 16px', padding: '0 16px' }} className="fade-in-up" >
          <div className="glass" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d4d4d4', fontSize: 13 }}>
              <MapPin size={13} color="#e10600" />
              <span style={{ fontWeight: 600 }}>{progress.current.circuit_short_name}</span>
              <span style={{ color: '#737373' }}>|</span>
              <span style={{ color: '#a3a3a3' }}>{progress.current.country_name}</span>
            </div>
            {weather ? (
              <div className="weather-stats" style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Thermometer size={12} color="#fb923c" /> <strong style={{ color: '#fff' }}>{weather.air_temperature ?? '--'}&deg;</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Thermometer size={12} color="#f87171" /> Track <strong style={{ color: '#fff' }}>{weather.track_temperature ?? '--'}&deg;</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Droplets size={12} color="#60a5fa" /> <strong style={{ color: '#fff' }}>{weather.humidity ?? '--'}%</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Wind size={12} color="#34d399" /> <strong style={{ color: '#fff' }}>{weather.wind_speed ?? '--'} km/h</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, color: weather.rainfall != null && weather.rainfall > 0 ? '#60a5fa' : '#34d399' }}>
                  {weather.rainfall != null && weather.rainfall > 0 ? <><CloudRain size={12} /> WET</> : 'DRY'}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="skeleton skeleton-text" style={{ width: 50 }} />
                <div className="skeleton skeleton-text" style={{ width: 60 }} />
                <div className="skeleton skeleton-text" style={{ width: 40 }} />
                <div className="skeleton skeleton-text" style={{ width: 55 }} />
                <div className="skeleton skeleton-text" style={{ width: 30 }} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1100, margin: '0 auto 16px', padding: '0 16px' }} className="fade-in-up">
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12 }}>
            <div className="skeleton skeleton-text" style={{ width: 140, height: 14 }} />
            <div className="skeleton skeleton-text" style={{ width: 80, height: 14 }} />
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '24px 16px 32px', maxWidth: 1100, margin: '0 auto', position: 'relative' }} className="fade-in-up">
        {/* Subtle radial glow behind hero */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,6,0,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <h1 className="hero-title" style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em', marginBottom: 6, position: 'relative' }}>
          <span style={{ color: '#fff' }}>F1</span>
          <span style={{ color: '#e10600' }}>TV</span>
        </h1>
        <p style={{ fontSize: 11, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 700, marginBottom: 24, position: 'relative' }}>
          Live Formula 1 Streaming
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
          <button className="btn-red" onClick={() => navigate('/stream')} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 32px', borderRadius: 14, fontSize: 16, fontWeight: 700, fontFamily: 'inherit' }}>
            <Play size={18} fill="#fff" /> Watch Live
          </button>
          <Link to="/highlights" className="glass glass-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderRadius: 14, fontSize: 14, fontWeight: 600, textDecoration: 'none', color: '#d4d4d4' }}>
            <Calendar size={15} /> Race Highlights
          </Link>
        </div>
      </div>

      {/* Session Widget */}
      <div style={{ maxWidth: 700, margin: '0 auto 32px', padding: '0 16px' }} className="fade-in-up">
        {progress ? (
          <SessionWidget progress={progress} />
        ) : (
          <div className="glass skeleton-pill" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 16 }}>
            <div className="skeleton skeleton-circle" style={{ width: 44, height: 44, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton skeleton-text" style={{ width: '60%', height: 14 }} />
              <div className="skeleton skeleton-text" style={{ width: '40%', height: 10 }} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <div className="skeleton" style={{ width: 30, height: 36, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 30, height: 36, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 30, height: 36, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 30, height: 36, borderRadius: 6 }} />
            </div>
          </div>
        )}
      </div>

      {/* Standings Toggle */}
      <div style={{ maxWidth: 900, margin: '0 auto 32px', padding: '0 16px' }} className="fade-in-up">
        <button
          className="glass"
          onClick={() => setShowStandings(!showStandings)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderRadius: 12, color: '#d4d4d4', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <Trophy size={13} />
            {drivers.length > 0 ? (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#737373', fontWeight: 400 }}>Standings</span>
                <span style={{ color: '#525252', margin: '0 4px' }}>·</span>
                <span style={{ color: '#facc15', fontWeight: 700 }}>{drivers[0].driverName}</span>
                <span style={{ color: '#737373', fontWeight: 400 }}> leads by {Number(drivers[0].points) - Number(drivers[1]?.points ?? 0)} pts</span>
              </span>
            ) : (
              <span>Championship Standings</span>
            )}
          </div>
          <span style={{ transform: showStandings ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexShrink: 0 }}><ChevronRight size={13} /></span>
        </button>
        {showStandings && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 12 }}>
            <div className="glass scale-in" style={{ borderRadius: 12, padding: 14 }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: 10 }}>Drivers</h3>
              {drivers.map((d) => (
                <div key={d.driverId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="stagger-in" >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, textAlign: 'center', fontSize: 12, fontWeight: 700, color: d.positionText === '1' ? '#facc15' : '#737373' }}>{d.positionText}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{d.driverName}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{d.points}</span>
                </div>
              ))}
            </div>
            <div className="glass scale-in" style={{ borderRadius: 12, padding: 14, animationDelay: '0.1s' }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: 10 }}>Constructors</h3>
              {constructors.map((c) => (
                <div key={c.constructorId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="stagger-in" >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, textAlign: 'center', fontSize: 12, fontWeight: 700, color: c.positionText === '1' ? '#facc15' : '#737373' }}>{c.positionText}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{c.constructorName}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{c.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next 3 Races */}
      {sessions.length > 0 && (() => {
        const now = new Date();
        const upcomingRaces = sessions
          .filter((s) => !s.is_cancelled && s.session_name === 'Race' && new Date(s.date_start) > now)
          .slice(0, 3);
        if (upcomingRaces.length === 0) return null;
        return (
          <div style={{ maxWidth: 900, margin: '0 auto 32px', padding: '0 16px' }} className="fade-in-up">
            <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flag size={12} color="#e10600" /> Upcoming Races
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {upcomingRaces.map((race) => {
                const raceDate = new Date(race.date_start);
                const diffMs = raceDate.getTime() - Date.now();
                const daysAway = Math.ceil(diffMs / 86400000);
                return (
                  <div key={race.session_key} className="glass glass-hover" style={{ padding: '12px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }} >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.2)',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#e10600', lineHeight: 1 }}>{raceDate.getDate()}</span>
                      <span style={{ fontSize: 8, fontWeight: 600, color: '#e10600', textTransform: 'uppercase' }}>{raceDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {race.circuit_short_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#737373', marginTop: 1 }}>
                        {daysAway <= 0 ? 'This weekend' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <Footer />
    </PageWrapper>
  );
}

function SessionWidget({ progress }: { progress: { current: F1Session; upcoming: F1Session[]; finished: F1Session[] } }) {
  const { current, upcoming, finished } = progress;
  const [now, setNow] = useState(Date.now());
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const status = getSessionStatus(current);
  const date = new Date(current.date_start);
  const isLive = status === 'live';
  const sessionLabel = getSessionLabel(current.session_type, current.session_name);
  const sessionFullLabel = getSessionFullLabel(current.session_name);

  const queue = [...finished.slice(-2), current, ...upcoming.slice(0, 3)];
  const dedupedQueue = queue.filter((s, i, arr) => arr.findIndex((x) => x.session_key === s.session_key) === i);

  // NEXT badge: when current is live, next = first upcoming after it;
  // when current is upcoming (not live), current itself IS next.
  const isCurrentLive = getSessionStatus(current) === 'live';
  const nextSessionKey = isCurrentLive
    ? dedupedQueue.find((s) => s.session_key !== current.session_key && getSessionStatus(s) === 'upcoming')?.session_key
    : current.session_key;

  return (
    <div style={{ position: 'relative' }}>
      {/* Main pill */}
      <div
        className={`glass-strong session-pill session-pill-layout ${isLive ? 'session-pill-live' : ''}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px', borderRadius: 16, cursor: 'default',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Status dot */}
        <div className="session-badge" style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isLive
              ? 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.08))'
              : 'linear-gradient(135deg, rgba(225,6,0,0.2), rgba(225,6,0,0.05))',
            border: isLive ? '2px solid rgba(239,68,68,0.5)' : '2px solid rgba(225,6,0,0.3)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: isLive ? '#f87171' : '#e10600' }}>
              {sessionLabel}
            </span>
          </div>
          {isLive && (
            <span className="pulse-dot" style={{
              position: 'absolute', top: -2, right: -2,
              width: 10, height: 10, borderRadius: '50%',
              background: '#ef4444', border: '2px solid #111',
            }} />
          )}
        </div>

        {/* Info */}
        <div className="session-info" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {current.circuit_short_name}
            </span>
            <span style={{ fontSize: 11, color: '#737373' }}>|</span>
            <span style={{ fontSize: 12, color: '#a3a3a3' }}>{current.country_name}</span>
          </div>
          <div className="session-info-detail" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#737373' }}>
            <span style={{ fontSize: 10, color: '#737373', fontWeight: 600 }}>{sessionFullLabel}</span>
            <span style={{ color: '#333' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} />
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Countdown */}
        <div className="session-countdown" style={{ flexShrink: 0 }}>
          {isLive ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#f87171' }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              LIVE NOW
            </span>
          ) : (
            <PillCountdown target={current.date_start} now={now} />
          )}
        </div>

        {/* Queue toggle */}
        {dedupedQueue.length > 1 && (
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="session-queue-btn"
            style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#737373', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#d4d4d4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#737373'; }}
          >
            <ChevronDown size={14} style={{ transform: showQueue ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)' }} />
          </button>
        )}
      </div>

      {/* Session queue */}
      {showQueue && dedupedQueue.length > 1 && (
        <div className="glass slide-in-down" style={{
          marginTop: 6, borderRadius: 14, overflow: 'hidden', padding: '6px 0',
        }}>
          {dedupedQueue.map((s, i) => {
            const isActive = s.session_key === current.session_key;
            const isNext = s.session_key === nextSessionKey;
            const isFinished = getSessionStatus(s) === 'finished';
            const sDate = new Date(s.date_start);
            const isNextUpcoming = isNext && !isFinished;
            return (
              <div
                key={s.session_key + '-' + i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                  background: isActive ? 'rgba(225,6,0,0.08)' : 'transparent',
                  opacity: isFinished ? 0.55 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 900, minWidth: 36, textAlign: 'center',
                  padding: '2px 6px', borderRadius: 5,
                  ...getSessionBadgeStyle(s.session_type, s.session_name),
                }}>
                  {getSessionLabel(s.session_type, s.session_name)}
                </span>
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : '#d4d4d4', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.circuit_short_name}
                </span>
                {isNextUpcoming && (
                  <span style={{ fontSize: 8, fontWeight: 900, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '1px 5px', borderRadius: 4, flexShrink: 0, letterSpacing: '0.05em' }}>
                    NEXT
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#737373', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {sDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  <span style={{ color: '#525252' }}>·</span>
                  {sDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
                {isFinished && (
                  <span style={{ fontSize: 8, fontWeight: 900, color: '#737373', background: 'rgba(115,115,115,0.15)', padding: '1px 5px', borderRadius: 4, flexShrink: 0, letterSpacing: '0.03em' }}>
                    DONE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getSessionBadgeStyle(_type: string, name: string): React.CSSProperties {
  const base: React.CSSProperties = { display: 'inline-block' };
  if (name === 'Race' || name === 'Sprint') return { ...base, background: 'rgba(225,6,0,0.25)', color: '#f87171' };
  if (name === 'Qualifying' || name === 'Sprint Qualifying') return { ...base, background: 'rgba(234,179,8,0.2)', color: '#facc15' };
  if (name.startsWith('Practice') || name.startsWith('Day')) return { ...base, background: 'rgba(59,130,246,0.2)', color: '#60a5fa' };
  return { ...base, background: 'rgba(113,113,122,0.2)', color: '#a3a3a3' };
}

function getSessionFullLabel(name: string): string {
  if (name === 'Practice 1') return 'Free Practice 1';
  if (name === 'Practice 2') return 'Free Practice 2';
  if (name === 'Practice 3') return 'Free Practice 3';
  if (name === 'Sprint Qualifying') return 'Sprint Qualifying';
  if (name === 'Sprint') return 'Sprint Race';
  if (name === 'Qualifying') return 'Qualifying';
  if (name === 'Race') return 'Race';
  return name;
}

function PillCountdown({ target, now }: { target: string; now: number }) {
  const diff = Math.max(0, new Date(target).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const segments = [
    { v: d, l: 'Days' },
    { v: h, l: 'Hrs' },
    { v: m, l: 'Min' },
    { v: s, l: 'Sec' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {segments.map((u, i) => (
        <div key={u.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div className="countdown-unit glass" style={{ textAlign: 'center', padding: '4px 6px', borderRadius: 6, minWidth: 30 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{String(u.v).padStart(2, '0')}</div>
            <div style={{ fontSize: 8, color: '#737373', fontWeight: 600, textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.02em' }}>{u.l}</div>
          </div>
          {i < 3 && <span style={{ color: '#525252', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>:</span>}
        </div>
      ))}
    </div>
  );
}
