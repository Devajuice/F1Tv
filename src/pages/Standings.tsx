import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Car } from 'lucide-react';
import { getDriverStandings, getConstructorStandings } from '../api/f1Api';
import type { DriverStanding, ConstructorStanding } from '../api/f1Api';

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

export default function Standings() {
  const [tab, setTab] = useState<Tab>('drivers');
  const [drivers, setDrivers] = useState<DriverStanding[]>([]);
  const [constructors, setConstructors] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getDriverStandings(), getConstructorStandings()]).then(([d, c]) => {
      setDrivers(d);
      setConstructors(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const data = tab === 'drivers' ? drivers : constructors;
  const maxPts = Number(data[0]?.points) || 1;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', maxWidth: 900, margin: '0 auto' }} className="slide-down">
        <Link to="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontStyle: 'italic' }}>F1</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#e10600', fontStyle: 'italic' }}>TV</span>
        </Link>
        <Link to="/home" className="glass" style={{ padding: '6px 12px', borderRadius: 8, color: '#a3a3a3', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
          <ArrowLeft size={13} /> Home
        </Link>
      </header>

      {/* Tabs */}
      <div style={{ maxWidth: 900, margin: '24px auto 20px', padding: '0 16px' }} className="fade-in-up">
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={22} color="#e10600" /> Championship Standings</h1>
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
          {(['drivers', 'constructors'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                border: 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: tab === t ? 'rgba(225,6,0,0.15)' : 'transparent',
                color: tab === t ? '#e10600' : '#737373',
              }}
            >
              {t === 'drivers' ? <><Users size={16} /> Drivers</> : <><Car size={16} /> Constructors</>}
            </button>
          ))}
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
            {/* Bar chart skeleton */}
            <div className="glass" style={{ borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div className="skeleton skeleton-text" style={{ width: 100, height: 10, marginBottom: 14 }} />
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div className="skeleton skeleton-text" style={{ width: `${60 - i * 3}%`, height: 12 }} />
                    <div className="skeleton skeleton-text" style={{ width: 24, height: 12 }} />
                  </div>
                  <div className="skeleton" style={{ height: 6, borderRadius: 3, width: `${100 - i * 8}%` }} />
                </div>
              ))}
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
          <div style={{ textAlign: 'center', padding: 48, color: '#525252' }}>No standings data available</div>
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
                  {tab === 'drivers' ? (data[0] as DriverStanding).driverName : (data[0] as ConstructorStanding).constructorName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  {tab === 'drivers' && (
                    <span style={{
                      display: 'inline-block', width: 24, height: 3, borderRadius: 2,
                      background: TEAM_COLORS[DRIVER_TEAMS[(data[0] as DriverStanding).driverName]] ?? '#525252',
                    }} />
                  )}
                  <span style={{ fontSize: 12, color: '#737373' }}>Championship Leader</span>
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{data[0].points}</div>
            </div>

            {/* Bar Chart */}
            <div className="glass scale-in" style={{ borderRadius: 14, padding: 16, marginBottom: 16, animationDelay: '0.1s' }}>
              <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#525252', marginBottom: 14 }}>
                {tab === 'drivers' ? 'Driver' : 'Constructor'} Standings
              </h3>
              {data.slice(0, 10).map((item, i) => {
                const pct = (Number(item.points) / maxPts) * 100;
                const team = tab === 'drivers' ? DRIVER_TEAMS[(item as DriverStanding).driverName] : (item as ConstructorStanding).constructorName;
                const color = TEAM_COLORS[team ?? ''] ?? '#737373';
                const name = tab === 'drivers' ? (item as DriverStanding).driverName : (item as ConstructorStanding).constructorName;
                return (
                  <div key={tab === 'drivers' ? (item as DriverStanding).driverId : (item as ConstructorStanding).constructorId} style={{ marginBottom: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#d4d4d4' }}>{item.positionText}. {name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{item.points}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: i === 0 ? color : `${color}88` }} className="bar-animate" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full Table */}
            <div className="glass scale-in" style={{ borderRadius: 14, overflow: 'hidden', animationDelay: '0.2s' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={thStyle}>Pos</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>{tab === 'drivers' ? 'Driver' : 'Constructor'}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, i) => {
                      const team = tab === 'drivers' ? DRIVER_TEAMS[(item as DriverStanding).driverName] : (item as ConstructorStanding).constructorName;
                      const color = TEAM_COLORS[team ?? ''] ?? '#737373';
                      const name = tab === 'drivers' ? (item as DriverStanding).driverName : (item as ConstructorStanding).constructorName;
                      return (
                        <tr key={tab === 'drivers' ? (item as DriverStanding).driverId : (item as ConstructorStanding).constructorId} style={{
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                        }}>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                display: 'inline-block', width: 3, height: 18, borderRadius: 2,
                                background: i === 0 ? '#facc15' : color,
                                opacity: i < 3 ? 1 : 0.4,
                              }} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? '#facc15' : '#737373' }}>{item.positionText}</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'left' }}>{name}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#fff' }}>{item.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: '#525252', borderBottom: '1px solid rgba(255,255,255,0.04)',
};
const tdStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: 13, fontWeight: 500, color: '#a3a3a3',
  borderBottom: '1px solid rgba(255,255,255,0.02)',
};
