import { useState, useEffect, useRef, useCallback } from 'react';
import { Flag, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getSchedule, getRaceResult } from '../api/f1Api';
import type { Race } from '../api/f1Api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

const TEAM_COLORS: Record<string, string> = {
  'Red Bull': '#3671C6', 'Mercedes': '#27F4D2', 'Ferrari': '#E8002D',
  'McLaren': '#FF8000', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'RB': '#6692FF', 'Kick Sauber': '#52E252',
  'Haas': '#B6BABD',
};

function getTeamColor(name: string): string {
  return TEAM_COLORS[name] ?? '#737373';
}

function getPositionChange(grid: string, position: string): { delta: number; label: string } {
  const g = parseInt(grid);
  const p = parseInt(position);
  if (isNaN(g) || isNaN(p) || g === 0) return { delta: 0, label: '-' };
  const diff = g - p;
  return { delta: diff, label: diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '-' };
}

function getStatusStyle(status: string): { color: string; bg: string } {
  if (status === 'Finished' || status.includes('+')) return { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' };
  if (status.includes('DSQ') || status.includes('Disqualified')) return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
  if (status.includes('DNF') || status.includes('Did not finish')) return { color: '#f97316', bg: 'rgba(249,115,22,0.08)' };
  if (status.includes('DNS') || status.includes('Did not start')) return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
  if (status.includes('Retired') || status.includes('Engine') || status.includes('Gearbox') || status.includes('Transmission') || status.includes('Suspension') || status.includes('Brakes') || status.includes('Collision') || status.includes('Accident') || status.includes('Overheating')) {
    return { color: '#f97316', bg: 'rgba(249,115,22,0.08)' };
  }
  return { color: '#737373', bg: 'transparent' };
}

export default function RaceResults() {
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [result, setResult] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [resultLoading, setResultLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const selectorRef = useRef<HTMLDivElement>(null);

  const updateDropdownPos = useCallback(() => {
    if (selectorRef.current) {
      const rect = selectorRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (showDropdown) updateDropdownPos();
  }, [showDropdown, updateDropdownPos]);

  useEffect(() => {
    getSchedule()
      .then((all) => {
        const completed = all.filter((r) => {
          const raceDate = new Date(r.date + (r.time ? `T${r.time}` : 'T14:00:00Z'));
          return raceDate < new Date();
        });
        setRaces(completed);
        if (completed.length > 0) {
          setSelectedRound(completed[completed.length - 1].round);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRound) return;
    setResultLoading(true);
    getRaceResult(new Date().getFullYear().toString(), selectedRound)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setResultLoading(false));
  }, [selectedRound]);

  const selectedRace = races.find((r) => r.round === selectedRound);
  const results = result?.results ?? [];

  return (
    <PageWrapper>
      <Header showBack backTo="/home" backLabel="Home" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 className="fade-in-up" style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flag size={22} color="#e10600" /> Race Results
        </h1>

        {/* Race Selector */}
        <div className="fade-in-up" ref={selectorRef} style={{ position: 'relative', marginBottom: 20 }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#d4d4d4', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <span>{loading ? 'Loading...' : selectedRace ? `Round ${selectedRace.round}: ${selectedRace.raceName}` : 'Select a race'}</span>
            <ChevronDown size={16} color="#737373" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {/* Results */}
        {resultLoading ? (
          <div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="glass" style={{ borderRadius: 12, padding: '10px 14px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="skeleton skeleton-text" style={{ width: 16, height: 12 }} />
                <div className="skeleton skeleton-circle" style={{ width: 28, height: 28 }} />
                <div className="skeleton skeleton-text" style={{ flex: 1, height: 12, maxWidth: `${70 - i * 4}%` }} />
                <div className="skeleton skeleton-text" style={{ width: 40, height: 12 }} />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="glass" style={{ borderRadius: 14, padding: 48, textAlign: 'center', color: '#737373' }}>
            No results available for this race
          </div>
        ) : (
          <div className="glass scale-in" style={{ borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            <div className="hidden-mobile" style={{
              display: 'flex', alignItems: 'center', padding: '10px 14px',
              background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(12px)',
              position: 'sticky', top: 0, zIndex: 2,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ ...thStyle, width: 36 }}>Pos</span>
              <span style={{ ...thStyle, width: 32 }}></span>
              <span style={{ ...thStyle, flex: 1, textAlign: 'left' }}>Driver</span>
              <span style={{ ...thStyle, textAlign: 'right', width: 50 }}>Grid</span>
              <span style={{ ...thStyle, textAlign: 'right', width: 40 }}></span>
              <span style={{ ...thStyle, textAlign: 'right', width: 50 }}>Pts</span>
              <span style={{ ...thStyle, textAlign: 'right', width: 90 }}>Status</span>
            </div>

            {/* Rows */}
            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {results.map((r, i) => {
                const color = getTeamColor(r.constructorName);
                const posChange = getPositionChange(r.grid, r.position);
                const statusStyle = getStatusStyle(r.status);
                return (
                  <div key={`${r.driverId}-${r.position}`} className="stagger-in" style={{
                    display: 'flex', alignItems: 'center', padding: '8px 14px',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                  }}>
                    {/* Position */}
                    <div style={{ width: 36, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        display: 'inline-block', width: 3, height: 16, borderRadius: 2,
                        background: parseInt(r.position) <= 3 ? (r.position === '1' ? '#facc15' : color) : color,
                        opacity: parseInt(r.position) <= 3 ? 1 : 0.4,
                      }} />
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: r.position === '1' ? '#facc15' : '#d4d4d4',
                        fontVariantNumeric: 'tabular-nums',
                      }}>{r.positionText}</span>
                    </div>

                    {/* Team colour dot */}
                    <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: color, display: 'inline-block',
                      }} />
                    </div>

                    {/* Driver */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.driverName}
                        </span>
                        {r.driverNumber && (
                          <span style={{ fontSize: 10, color: '#525252' }}>#{r.driverNumber}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#525252', marginTop: 1 }}>{r.constructorName}</div>
                    </div>

                    {/* Grid */}
                    <div className="hidden-mobile" style={{ width: 50, textAlign: 'right', fontSize: 12, color: '#737373', fontVariantNumeric: 'tabular-nums' }}>
                      {r.grid}
                    </div>

                    {/* Position change */}
                    <div className="hidden-mobile" style={{ width: 40, textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
                      {posChange.delta > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 11, fontWeight: 700, color: '#22c55e' }}>
                          <TrendingUp size={10} /> {posChange.label}
                        </span>
                      )}
                      {posChange.delta < 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 11, fontWeight: 700, color: '#ef4444' }}>
                          <TrendingDown size={10} /> {posChange.label}
                        </span>
                      )}
                      {posChange.delta === 0 && (
                        <Minus size={12} color="#525252" />
                      )}
                    </div>

                    {/* Points */}
                    <div style={{ width: 50, textAlign: 'right', fontSize: 13, fontWeight: 700, color: parseFloat(r.points) > 0 ? '#fff' : '#525252', fontVariantNumeric: 'tabular-nums' }}>
                      {r.points}
                    </div>

                    {/* Status */}
                    <div className="hidden-mobile" style={{ width: 90, textAlign: 'right' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: statusStyle.color,
                        background: statusStyle.bg,
                        padding: '2px 6px', borderRadius: 4,
                      }}>
                        {r.time ? `${r.time}` : r.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown portal - renders outside all stacking contexts */}
      {showDropdown && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowDropdown(false)} />
          <div className="slide-down" style={{
            position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
            zIndex: 100, maxHeight: 300, overflowY: 'auto',
            background: 'rgba(17,17,17,0.98)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            {races.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#737373', fontSize: 13 }}>
                No completed races yet
              </div>
            ) : (
              races.map((r) => (
                <button
                  key={r.round}
                  onClick={() => { setSelectedRound(r.round); setShowDropdown(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    background: r.round === selectedRound ? 'rgba(225,6,0,0.1)' : 'transparent',
                    border: 'none', color: r.round === selectedRound ? '#e10600' : '#d4d4d4',
                    fontSize: 13, fontWeight: r.round === selectedRound ? 700 : 500,
                    textAlign: 'left' as const, fontFamily: 'inherit', transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => { if (r.round !== selectedRound) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { if (r.round !== selectedRound) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 11, color: '#525252', minWidth: 24 }}>R{r.round}</span>
                  <span style={{ flex: 1 }}>{r.raceName}</span>
                  <span style={{ fontSize: 11, color: '#525252' }}>
                    {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}

      <Footer />
    </PageWrapper>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: '#737373',
};
