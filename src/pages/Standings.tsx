import { useState, useEffect } from 'react';
import { Trophy, Users, Car } from 'lucide-react';
import { getDriverStandings, getConstructorStandings } from '../api/f1Api';
import type { DriverStanding, ConstructorStanding } from '../api/f1Api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

type Tab = 'drivers' | 'constructors';

const TEAM_COLORS: Record<string, string> = {
  'Red Bull': '#3671C6', 'Mercedes': '#27F4D2', 'Ferrari': '#E8002D',
  'McLaren': '#FF8000', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'RB': '#6692FF', 'Kick Sauber': '#52E252',
  'Haas': '#B6BABD',
};

const DRIVER_TEAMS: Record<string, string> = {
  'Max Verstappen': 'Red Bull', 'Lando Norris': 'McLaren',
  'Oscar Piastri': 'McLaren', 'Charles Leclerc': 'Ferrari',
  'Lewis Hamilton': 'Ferrari', 'George Russell': 'Mercedes',
  'Kimi Antonelli': 'Mercedes', 'Fernando Alonso': 'Aston Martin',
  'Lance Stroll': 'Aston Martin', 'Pierre Gasly': 'Alpine',
  'Jack Doohan': 'Alpine', 'Alexander Albon': 'Williams',
  'Carlos Sainz': 'Williams', 'Nico Hulkenberg': 'Kick Sauber',
  'Gabriel Bortoleto': 'Kick Sauber', 'Yuki Tsunoda': 'RB',
  'Liam Lawson': 'RB', 'Esteban Ocon': 'Haas',
  'Oliver Bearman': 'Haas',
};

const TEAM_ORDER = ['Red Bull', 'McLaren', 'Ferrari', 'Mercedes', 'Aston Martin', 'Alpine', 'Williams', 'RB', 'Kick Sauber', 'Haas'];

export default function Standings() {
  const [tab, setTab] = useState<Tab>('drivers');
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const load = () => {
      return Promise.all([getDriverStandings(), getConstructorStandings()]).then(([d, c]) => {
        setDrivers(d);
        setConstructors(c);
        setLoading(false);
      }).catch(() => setLoading(false));
    };

    setLoading(true);
    load().then(() => {
      interval = setInterval(() => { load(); }, 180_000);
    });

    return () => { if (interval) clearInterval(interval); };
  }, []);

  const data = tab === 'drivers' ? drivers : constructors;

  const getTeamForItem = (item: DriverStanding | ConstructorStanding) => {
    return tab === 'drivers' ? DRIVER_TEAMS[(item as DriverStanding).driverName] : (item as ConstructorStanding).constructorName;
  };

  const getNameForItem = (item: DriverStanding | ConstructorStanding) => {
    return tab === 'drivers' ? (item as DriverStanding).driverName : (item as ConstructorStanding).constructorName;
  };

  const getKeyForItem = (item: DriverStanding | ConstructorStanding) => {
    return tab === 'drivers' ? (item as DriverStanding).driverId : (item as ConstructorStanding).constructorId;
  };

  return (
    <PageWrapper>
      <Header showBack backTo="/home" backLabel="Home" />

      {/* Tabs */}
      <div style={{ maxWidth: 900, margin: '24px auto 20px', padding: '0 16px' }} className="fade-in-up">
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={22} color="#e10600" /> Championship Standings</h1>
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
          {(['drivers', 'constructors'] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  border: 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit',
                  background: active ? 'rgba(225,6,0,0.15)' : 'transparent',
                  color: active ? '#e10600' : '#737373',
                  boxShadow: active ? 'inset 0 -2px 0 #e10600' : 'none',
                }}
              >
                {t === 'drivers' ? <><Users size={16} /> Drivers</> : <><Car size={16} /> Constructors</>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto 32px', padding: '0 16px' }}>
        {loading ? (
          <div>
            {/* Leader skeleton */}
            <div className="glass" style={{ borderRadius: 14, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="skeleton skeleton-circle" style={{ width: 48, height: 48, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton skeleton-text" style={{ width: '50%', height: 16 }} />
                <div className="skeleton skeleton-text" style={{ width: '30%', height: 10 }} />
              </div>
              <div className="skeleton skeleton-text" style={{ width: 40, height: 20 }} />
            </div>
            {/* Table skeleton */}
            <div className="glass" style={{ borderRadius: 14, padding: 16 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <div className="skeleton skeleton-text" style={{ width: 16, height: 12 }} />
                  <div className="skeleton skeleton-text" style={{ flex: 1, height: 12, maxWidth: `${70 - i * 4}%` }} />
                  <div className="skeleton skeleton-text" style={{ width: 30, height: 12 }} />
                </div>
              ))}
            </div>
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#737373' }}>No standings data available</div>
        ) : (
          <>
            {/* Leader Card */}
            <div className="glass-strong scale-in" style={{ borderRadius: 14, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(225,6,0,0.3), rgba(225,6,0,0.1))',
                border: '2px solid rgba(225,6,0,0.4)',
              }}>
                1
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getNameForItem(data[0])}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  {tab === 'drivers' && (
                    <span style={{
                      display: 'inline-block', width: 24, height: 3, borderRadius: 2,
                      background: TEAM_COLORS[getTeamForItem(data[0]) ?? ''] ?? '#525252',
                    }} />
                  )}
                  <span style={{ fontSize: 12, color: '#737373' }}>Championship Leader</span>
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{data[0].points}</div>
            </div>

            {/* Standings List */}
            <div className="glass scale-in" style={{ borderRadius: 14, overflow: 'hidden', animationDelay: '0.1s' }}>
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Header */}
                <div className="hidden-mobile" style={{
                  display: 'flex', alignItems: 'center', padding: '10px 14px',
                  background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(12px)',
                  position: 'sticky', top: 0, zIndex: 2,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ ...thStyle, width: 40, minWidth: 40 }}>Pos</span>
                  <span style={{ ...thStyle, flex: 1, textAlign: 'left' }}>{tab === 'drivers' ? 'Driver' : 'Constructor'}</span>
                  <span style={{ ...thStyle, textAlign: 'right', width: 60, minWidth: 60 }}>Pts</span>
                  <span style={{ ...thStyle, textAlign: 'right', width: 80, minWidth: 80 }}>Gap</span>
                </div>
                {/* Rows */}
                {data.map((item, i) => {
                  const team = getTeamForItem(item);
                  const color = TEAM_COLORS[team ?? ''] ?? '#737373';
                  const name = getNameForItem(item);
                  const pts = Number(item.points);
                  const leaderPts = Number(data[0].points) || 1;
                  const pct = (pts / leaderPts) * 100;
                  const gap = i === 0 ? 'Leader' : `-${Number(data[0].points) - pts}`;
                  return (
                    <div key={getKeyForItem(item)} style={{
                      padding: '10px 14px',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid rgba(255,255,255,0.02)',
                    }}>
                      {/* Top line: pos + name ... points */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 40, minWidth: 40, flexShrink: 0 }}>
                          <span style={{
                            display: 'inline-block', width: 3, height: 18, borderRadius: 2,
                            background: i === 0 ? '#facc15' : color,
                            opacity: i < 3 ? 1 : 0.4,
                          }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? '#facc15' : '#737373' }}>{item.positionText}</span>
                        </div>
                        <span style={{ flex: 1, color: '#d4d4d4', fontWeight: 600, fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: 14, flexShrink: 0, width: 60, minWidth: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.points}</span>
                        <div className="hidden-mobile" style={{ width: 80, minWidth: 80, flexShrink: 0 }} />
                      </div>
                      {/* Bottom line: bar ... gap */}
                      <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', marginTop: 5, paddingLeft: 46 }}>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden', width: 200, flexShrink: 0 }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: i === 0 ? color : `${color}88` }} className="bar-animate" />
                        </div>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: 12, color: i === 0 ? '#facc15' : '#737373', width: 80, minWidth: 80, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{gap}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Color Legend (drivers only) */}
            {tab === 'drivers' && (
              <div className="glass scale-in" style={{ borderRadius: 12, padding: 14, marginTop: 16, animationDelay: '0.2s' }}>
                <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#737373', marginBottom: 10 }}>Team Colors</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                  {TEAM_ORDER.map((team) => (
                    <div key={team} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: TEAM_COLORS[team] }} />
                      <span style={{ fontSize: 11, color: '#a3a3a3' }}>{team}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </PageWrapper>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: '#737373',
};
