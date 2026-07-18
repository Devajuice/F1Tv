import { useState, useEffect } from 'react';
import { Timer, ChevronDown } from 'lucide-react';
import { getSchedule, getQualifyingResult } from '../api/f1Api';
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

function getBestSession(q1: string | null, q2: string | null, q3: string | null): string | null {
  if (q3) return q3;
  if (q2) return q2;
  return q1;
}

function getRoundLabel(q1: string | null, q2: string | null, q3: string | null): { label: string; color: string } {
  if (q3) return { label: 'Q3', color: '#a855f7' };
  if (q2) return { label: 'Q2', color: '#eab308' };
  if (q1) return { label: 'Q1', color: '#737373' };
  return { label: '-', color: '#525252' };
}

export default function QualifyingResults() {
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [results, setResults] = useState<QualifyingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultLoading, setResultLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [showQ, setShowQ] = useState<'all' | 'q1' | 'q2' | 'q3'>('all');

  useEffect(() => {
    getSchedule()
      .then((all) => {
        const completed = all.filter((r) => {
          const refDate = r.qualifyingDate
            ? new Date(r.qualifyingDate + (r.qualifyingTime ? `T${r.qualifyingTime}` : 'T14:00:00Z'))
            : new Date(r.date + (r.time ? `T${r.time}` : 'T14:00:00Z'));
          return refDate < new Date();
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
      setResultLoading(true);
      getQualifyingResult(new Date().getFullYear().toString(), selectedRound)
        .then((r) => { if (!cancelled) setResults(r); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setResultLoading(false); });
    };

    fetch();
    const timer = setInterval(fetch, 30_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [selectedRound]);

  const selectedRace = races.find((r) => r.round === selectedRound);

  const filtered = results.filter((r) => {
    if (showQ === 'all') return true;
    if (showQ === 'q3') return r.q3 !== null;
    if (showQ === 'q2') return r.q2 !== null && !r.q3;
    if (showQ === 'q1') return r.q1 !== null && !r.q2;
    return true;
  });

  return (
    <PageWrapper>
      <Header showBack backTo="/home" backLabel="Home" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 className="fade-in-up" style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Timer size={22} color="#e10600" /> Qualifying Results
        </h1>

        {/* Race Selector */}
        <div className="fade-in-up" style={{ position: 'relative', marginBottom: 16 }}>
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
              if (!showDropdown) {
                requestAnimationFrame(() => {
                  const el = document.querySelector('[data-race-selector]');
                  if (el) { const r = el.getBoundingClientRect(); setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width }); }
                });
              }
            }}
            data-race-selector
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

        {/* Q Phase Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {(['all', 'q3', 'q2', 'q1'] as const).map((q) => (
            <button
              key={q}
              onClick={() => setShowQ(q)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
                background: showQ === q ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.03)',
                color: showQ === q ? '#e10600' : '#737373',
              }}
            >
              {q === 'all' ? 'All' : q.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Results */}
        {resultLoading ? (
          <div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="glass" style={{ borderRadius: 12, padding: '10px 14px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="skeleton skeleton-text" style={{ width: 16, height: 12 }} />
                <div className="skeleton skeleton-circle" style={{ width: 28, height: 28 }} />
                <div className="skeleton skeleton-text" style={{ flex: 1, height: 12, maxWidth: `${70 - i * 4}%` }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass" style={{ borderRadius: 14, padding: 48, textAlign: 'center', color: '#737373' }}>
            No qualifying results available
          </div>
        ) : (
          <div className="glass scale-in" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div className="hidden-mobile" style={{
              display: 'flex', alignItems: 'center', padding: '10px 14px',
              background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(12px)',
              position: 'sticky', top: 0, zIndex: 2,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ ...thStyle, width: 36 }}>Pos</span>
              <span style={{ ...thStyle, width: 32 }}></span>
              <span style={{ ...thStyle, flex: 1, textAlign: 'left' }}>Driver</span>
              <span style={{ ...thStyle, textAlign: 'center', width: 40 }}>Q</span>
              <span style={{ ...thStyle, textAlign: 'right', width: 80 }}>Q1</span>
              <span style={{ ...thStyle, textAlign: 'right', width: 80 }}>Q2</span>
              <span style={{ ...thStyle, textAlign: 'right', width: 80 }}>Q3</span>
            </div>

            <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {filtered.map((r, i) => {
                const color = getTeamColor(r.constructorName);
                const best = getBestSession(r.q1, r.q2, r.q3);
                const round = getRoundLabel(r.q1, r.q2, r.q3);
                return (
                  <div key={r.driverId} className="stagger-in" style={{
                    display: 'flex', alignItems: 'center', padding: '8px 14px',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                  }}>
                    <div style={{ width: 36, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ display: 'inline-block', width: 3, height: 16, borderRadius: 2, background: parseInt(r.position) <= 3 ? (r.position === '1' ? '#facc15' : color) : color, opacity: parseInt(r.position) <= 3 ? 1 : 0.4 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: r.position === '1' ? '#facc15' : '#d4d4d4', fontVariantNumeric: 'tabular-nums' }}>{r.position}</span>
                    </div>
                    <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.driverName}</span>
                        {r.driverNumber && <span style={{ fontSize: 10, color: '#525252' }}>#{r.driverNumber}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#525252', marginTop: 1 }}>{r.constructorName}</div>
                    </div>
                    <div className="hidden-mobile" style={{ width: 40, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: round.color, background: `${round.color}15`, padding: '2px 6px', borderRadius: 4 }}>{round.label}</span>
                    </div>
                    {(['q1', 'q2', 'q3'] as const).map((q) => {
                      const val = r[q];
                      const isBest = best === val && val !== null;
                      return (
                        <div key={q} className="hidden-mobile" style={{ width: 80, textAlign: 'right' }}>
                          <span style={{
                            fontSize: 12, fontWeight: isBest ? 700 : 500,
                            color: isBest ? '#a855f7' : val ? '#d4d4d4' : '#333',
                            fontVariantNumeric: 'tabular-nums',
                          }}>{val ?? '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown portal */}
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

const thStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: '#737373',
};
