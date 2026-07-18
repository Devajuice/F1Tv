import { useState, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { getSchedule, getPracticeSchedule } from '../api/f1Api';
import type { Race, PracticeSession } from '../api/f1Api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

function formatSessionTime(date: string, time: string): string {
  if (!date) return '--:--';
  const iso = time ? `${date}T${time}` : `${date}T14:00:00Z`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getSessionColor(name: string): string {
  if (name.startsWith('Practice')) return '#60a5fa';
  if (name === 'Sprint Qualifying') return '#eab308';
  if (name === 'Sprint') return '#a855f7';
  if (name === 'Qualifying') return '#f87171';
  return '#737373';
}

export default function PracticeSchedule() {
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultLoading, setResultLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    getSchedule()
      .then((all) => {
        const now = new Date();
        const upcoming = all.filter((r) => {
          const raceDate = new Date(r.date + (r.time ? `T${r.time}` : 'T14:00:00Z'));
          return raceDate > now;
        });
        setRaces(upcoming);
        if (upcoming.length > 0) setSelectedRound(upcoming[0].round);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRound) return;
    let cancelled = false;
    setResultLoading(true);
    getPracticeSchedule(new Date().getFullYear().toString(), selectedRound)
      .then((s) => { if (!cancelled) setSessions(s); })
      .catch(() => { if (!cancelled) setSessions([]); })
      .finally(() => { if (!cancelled) setResultLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRound]);

  const selectedRace = races.find((r) => r.round === selectedRound);

  return (
    <PageWrapper>
      <Header showBack backTo="/home" backLabel="Home" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 className="fade-in-up" style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={22} color="#e10600" /> Session Schedule
        </h1>

        <div className="fade-in-up" style={{ position: 'relative', marginBottom: 16 }}>
          <button
            onClick={() => {
              setShowDropdown(!showDropdown);
              if (!showDropdown) {
                requestAnimationFrame(() => {
                  const el = document.querySelector('[data-practice-selector]');
                  if (el) { const r = el.getBoundingClientRect(); setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width }); }
                });
              }
            }}
            data-practice-selector
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
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass" style={{ borderRadius: 12, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="skeleton skeleton-text" style={{ width: 80, height: 12 }} />
                <div className="skeleton skeleton-text" style={{ flex: 1, height: 12, maxWidth: '60%' }} />
                <div className="skeleton skeleton-text" style={{ width: 60, height: 12 }} />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass" style={{ borderRadius: 14, padding: 48, textAlign: 'center', color: '#737373' }}>
            No session schedule available for this round
          </div>
        ) : (
          <div className="glass scale-in" style={{ borderRadius: 14, overflow: 'hidden' }}>
            <div className="hidden-mobile" style={{
              display: 'flex', alignItems: 'center', padding: '10px 14px',
              background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(12px)',
              position: 'sticky', top: 0, zIndex: 2,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={thStyle}>Session</span>
              <span style={{ ...thStyle, flex: 1, textAlign: 'left' }}>Date</span>
              <span style={{ ...thStyle, textAlign: 'right' }}>Local Time</span>
            </div>

            <div>
              {sessions.map((s, i) => {
                const color = getSessionColor(s.name);
                const label = s.name === 'Practice 1' ? 'P1' : s.name === 'Practice 2' ? 'P2' : s.name === 'Practice 3' ? 'P3' : s.name === 'Sprint Qualifying' ? 'SQ' : s.name === 'Sprint' ? 'SPRINT' : s.name === 'Qualifying' ? 'QUALI' : s.name;
                return (
                  <div key={s.name} className="stagger-in" style={{
                    display: 'flex', alignItems: 'center', padding: '12px 14px',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    borderBottom: i < sessions.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color, background: `${color}15`,
                        padding: '3px 8px', borderRadius: 5, minWidth: 28, textAlign: 'center',
                      }}>
                        {label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.name}</span>
                    </div>
                    <span style={{ flex: 1, fontSize: 13, color: '#a3a3a3' }}>{formatDate(s.date)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#d4d4d4', fontVariantNumeric: 'tabular-nums' }}>{formatSessionTime(s.date, s.time)}</span>
                  </div>
                );
              })}
            </div>
          </div>
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
            {races.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: '#737373', fontSize: 13 }}>No upcoming races</div>
            )}
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
