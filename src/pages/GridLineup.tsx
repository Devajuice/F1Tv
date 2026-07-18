import { useState, useEffect } from 'react';
import { Grid3x3, ChevronDown } from 'lucide-react';
import { getSchedule, getGridLineup } from '../api/f1Api';
import type { Race, QualifyingResult } from '../api/f1Api';
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

function GridCard({ r, align }: { r: QualifyingResult; align: 'left' | 'right' }) {
  const color = getTeamColor(r.constructorName);
  const pos = parseInt(r.position);
  const bestQ = r.q3 ?? r.q2 ?? r.q1;
  const isPole = pos === 1;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      flexDirection: align === 'right' ? 'row-reverse' : 'row',
      textAlign: align === 'right' ? 'right' : 'left',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${color}30, ${color}08)`,
        border: `2px solid ${isPole ? '#facc15' : `${color}60`}`,
        boxShadow: isPole ? '0 0 16px rgba(250,204,21,0.2)' : 'none',
      }}>
        <span style={{
          fontSize: isPole ? 16 : 14, fontWeight: 900,
          color: isPole ? '#facc15' : '#fff',
          fontVariantNumeric: 'tabular-nums',
        }}>{r.position}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          flexDirection: align === 'right' ? 'row-reverse' : 'row',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{
            fontSize: 13, fontWeight: 700, color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {r.driverName.split(' ').pop()}
          </span>
          {r.driverNumber && <span style={{ fontSize: 9, color: '#525252' }}>#{r.driverNumber}</span>}
        </div>
        <div style={{
          fontSize: 10, color: '#525252', marginTop: 1,
          paddingLeft: align === 'right' ? 0 : 11,
          paddingRight: align === 'right' ? 11 : 0,
          textAlign: align === 'right' ? 'right' : 'left',
        }}>
          {r.constructorName}
        </div>
      </div>

      {bestQ && (
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#737373',
          fontVariantNumeric: 'tabular-nums', flexShrink: 0,
        }}>
          {bestQ}
        </span>
      )}
    </div>
  );
}

export default function GridLineup() {
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [results, setResults] = useState<QualifyingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultLoading, setResultLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    getSchedule()
      .then((all) => {
        const completed = all.filter((r) => {
          const raceDate = new Date(r.date + (r.time ? `T${r.time}` : 'T14:00:00Z'));
          return raceDate < new Date();
        });
        setRaces(completed);
        if (completed.length > 0) setSelectedRound(completed[completed.length - 1].round);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRound) return;
    let cancelled = false;

    const fetch = () => {
      getGridLineup(new Date().getFullYear().toString(), selectedRound)
        .then((r) => { if (!cancelled) setResults(r); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setResultLoading(false); });
    };

    setResultLoading(true);
    fetch();
    const timer = setInterval(fetch, 30_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [selectedRound]);

  const selectedRace = races.find((r) => r.round === selectedRound);

  return (
    <PageWrapper>
      <Header showBack backTo="/home" backLabel="Home" />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        <h1 className="fade-in-up" style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Grid3x3 size={22} color="#e10600" /> Starting Grid
        </h1>

        <div className="fade-in-up" style={{ position: 'relative', marginBottom: 24 }}>
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
              if (!showDropdown) {
                requestAnimationFrame(() => {
                  const el = document.querySelector('[data-grid-selector]');
                  if (el) { const r = el.getBoundingClientRect(); setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width }); }
                });
              }
            }}
            data-grid-selector
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#d4d4d4', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            <span>{loading ? 'Loading...' : selectedRace ? `Round ${selectedRace.round}: ${selectedRace.raceName}` : 'Select a race'}</span>
            <ChevronDown size={16} color="#737373" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {resultLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="glass" style={{ borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="skeleton skeleton-circle" style={{ width: 36, height: 36 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '70%', height: 12 }} />
                  <div className="skeleton skeleton-text" style={{ width: '40%', height: 10, marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="glass" style={{ borderRadius: 14, padding: 48, textAlign: 'center', color: '#737373' }}>
            No grid data available for this round
          </div>
        ) : (
          <>
            {/* Desktop: staggered grid */}
            <div className="hidden-mobile fade-in-up" style={{ flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 8px' }}>
                <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, transparent, rgba(225,6,0,0.4), transparent)' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#e10600', textTransform: 'uppercase', letterSpacing: '0.15em', flexShrink: 0 }}>START</span>
                <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, transparent, rgba(225,6,0,0.4), transparent)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(() => {
                  const rows: [QualifyingResult | null, QualifyingResult | null][] = [];
                  for (let i = 0; i < results.length; i += 2) {
                    rows.push([results[i] ?? null, results[i + 1] ?? null]);
                  }
                  return rows.map(([left, right], i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 1fr', gap: 0, alignItems: 'center' }}>
                      <div style={{ paddingRight: 8 }}>
                        {left && <GridCard r={left} align="left" />}
                      </div>
                      <div style={{ width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {i < rows.length - 1 && (
                          <div style={{ position: 'absolute', top: 20, bottom: -4, width: 2, background: 'rgba(255,255,255,0.06)' }} />
                        )}
                        <span style={{ fontSize: 8, fontWeight: 700, color: '#333', background: '#0a0a0a', padding: '2px 4px', borderRadius: 4, position: 'relative', zIndex: 1 }}>{i + 1}</span>
                      </div>
                      <div style={{ paddingLeft: 8, marginTop: 16 }}>
                        {right && <GridCard r={right} align="right" />}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '0 8px' }}>
                <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.15em', flexShrink: 0 }}>P{results.length}</span>
                <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />
              </div>
            </div>

            {/* Mobile: single column list — all cards equal */}
            <div className="mobile-only fade-in-up" style={{ flexDirection: 'column' }}>
              {results.map((r) => {
                const color = getTeamColor(r.constructorName);
                const bestQ = r.q3 ?? r.q2 ?? r.q1;
                return (
                  <div key={r.driverId} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', marginBottom: 6, borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${color}18`, border: `1px solid ${color}40`,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{r.position}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#525252', fontWeight: 600, marginRight: 4 }}>{r.position}.</span>
                        {r.driverName}
                      </span>
                      <span style={{ fontSize: 10, color: '#525252' }}>{r.constructorName}</span>
                    </div>
                    {bestQ && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#737373', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{bestQ}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

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
            {races.map((r) => (
              <button
                key={r.round}
                onClick={() => { setSelectedRound(r.round); setShowDropdown(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  background: r.round === selectedRound ? 'rgba(225,6,0,0.1)' : 'transparent',
                  border: 'none', color: r.round === selectedRound ? '#e10600' : '#d4d4d4',
                  fontSize: 13, fontWeight: r.round === selectedRound ? 700 : 500,
                  textAlign: 'left' as const, fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 11, color: '#525252', minWidth: 24 }}>R{r.round}</span>
                <span style={{ flex: 1 }}>{r.raceName}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <Footer />
    </PageWrapper>
  );
}
