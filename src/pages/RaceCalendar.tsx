import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, ChevronRight, Download } from 'lucide-react';
import { getSchedule } from '../api/f1Api';
import type { Race } from '../api/f1Api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';
import { getTrackImageUrl } from '../api/openf1';

function formatRaceDate(date: string, time?: string): string {
  const d = new Date(date + (time ? `T${time}` : 'T14:00:00Z'));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatRaceTime(time?: string): string {
  if (!time) return 'TBC';
  const [h, m] = time.replace('Z', '').split(':').map(Number);
  const d = new Date();
  d.setUTCHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

function getRaceStatus(date: string, time?: string): 'completed' | 'live' | 'upcoming' {
  const now = new Date();
  const raceDate = new Date(date + (time ? `T${time}` : 'T14:00:00Z'));
  const endDate = new Date(raceDate.getTime() + 2 * 3600000);
  if (now > endDate) return 'completed';
  if (now >= raceDate && now <= endDate) return 'live';
  return 'upcoming';
}

function daysUntil(date: string): number {
  const now = new Date();
  const race = new Date(date);
  const diff = race.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function generateICS(race: Race): string {
  const start = new Date(race.date + (race.time ? `T${race.time}` : 'T14:00:00Z'));
  const end = new Date(start.getTime() + 2 * 3600000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//F1TV//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${race.raceName}`,
    `LOCATION:${race.circuitName}, ${race.country}`,
    `DESCRIPTION:${race.raceName} - ${race.circuitName}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadICS(race: Race) {
  const ics = generateICS(race);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${race.raceName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

const COUNTRY_FLAGS: Record<string, string> = {
  'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
  'China': '🇨🇳', 'USA': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨',
  'Canada': '🇨🇦', 'Spain': '🇪🇸', 'Austria': '🇦🇹', 'United Kingdom': '🇬🇧',
  'Hungary': '🇭🇺', 'Belgium': '🇧🇪', 'Netherlands': '🇳🇱', 'Singapore': '🇸🇬',
  'Azerbaijan': '🇦🇿', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷', 'Qatar': '🇶🇦',
  'Abu Dhabi': '🇦🇪', 'Las Vegas': '🇺🇸', 'Miami': '🇺🇸', 'Emilia Romagna': '🇮🇹',
};

export default function RaceCalendar() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);

  useEffect(() => {
    getSchedule()
      .then(setRaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const nextRace = races.find((r) => getRaceStatus(r.date, r.time) === 'upcoming');

  return (
    <PageWrapper>
      <Header showBack backTo="/home" backLabel="Home" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 className="fade-in-up" style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={22} color="#e10600" /> {new Date().getFullYear()} Race Calendar
        </h1>

        {loading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass" style={{ borderRadius: 14, padding: 16, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="skeleton skeleton-circle" style={{ width: 56, height: 56, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton skeleton-text" style={{ width: '60%', height: 14 }} />
                  <div className="skeleton skeleton-text" style={{ width: '40%', height: 10 }} />
                </div>
                <div className="skeleton skeleton-text" style={{ width: 50, height: 14 }} />
              </div>
            ))}
          </div>
        ) : races.length === 0 ? (
          <div className="glass" style={{ borderRadius: 14, padding: 48, textAlign: 'center', color: '#737373' }}>
            No race calendar data available
          </div>
        ) : (
          <div>
            {/* Next Race Banner */}
            {nextRace && (
              <div className="glass-strong scale-in" style={{ borderRadius: 14, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, borderColor: 'rgba(225,6,0,0.2)' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                  background: 'rgba(225,6,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img
                    src={getTrackImageUrl(nextRace.locality)}
                    alt={nextRace.circuitName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#e10600', marginBottom: 2 }}>
                    Next Race
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nextRace.raceName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 12, color: '#737373' }}>
                    <MapPin size={11} /> {nextRace.circuitName}
                    <span style={{ color: '#525252' }}>|</span>
                    <Clock size={11} /> {formatRaceDate(nextRace.date, nextRace.time)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#e10600' }}>{daysUntil(nextRace.date)}</div>
                  <div style={{ fontSize: 10, color: '#737373', textTransform: 'uppercase' as const }}>days</div>
                </div>
              </div>
            )}

            {/* Race List */}
            {races.map((race, i) => {
              const status = getRaceStatus(race.date, race.time);
              const isNext = race.round === nextRace?.round;
              const flag = COUNTRY_FLAGS[race.country] ?? '🏁';
              const expanded = selectedRound === race.round;

              return (
                <div key={race.round} className="stagger-in glass-hover" style={{ marginBottom: 6 }}>
                  <button
                    onClick={() => setSelectedRound(expanded ? null : race.round)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                      background: isNext ? 'rgba(225,6,0,0.06)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                      border: isNext ? '1px solid rgba(225,6,0,0.2)' : '1px solid rgba(255,255,255,0.05)',
                      textAlign: 'left' as const, fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isNext ? 'rgba(225,6,0,0.06)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'; }}
                  >
                    {/* Round number */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: status === 'completed' ? '#525252' : '#fff',
                      background: status === 'completed' ? 'rgba(255,255,255,0.03)' : 'rgba(225,6,0,0.1)',
                      flexShrink: 0,
                    }}>
                      {race.round}
                    </div>

                    {/* Circuit image */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                      background: 'rgba(255,255,255,0.03)',
                    }}>
                      <img
                        src={getTrackImageUrl(race.locality)}
                        alt={race.circuitName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: status === 'completed' ? 0.5 : 1 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: status === 'completed' ? '#737373' : '#fff',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {flag} {race.raceName}
                      </div>
                      <div style={{ fontSize: 11, color: '#525252', marginTop: 1 }}>
                        {race.circuitName}
                      </div>
                    </div>

                    {/* Date */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: status === 'completed' ? '#525252' : '#a3a3a3' }}>
                        {formatRaceDate(race.date, race.time)}
                      </div>
                      <div style={{ fontSize: 11, color: '#525252' }}>
                        {formatRaceTime(race.time)}
                      </div>
                    </div>

                    {/* Status / Expand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {status === 'completed' && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#525252', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                          DONE
                        </span>
                      )}
                      {status === 'live' && (
                        <span className="pulse-dot" style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                          LIVE
                        </span>
                      )}
                      {isNext && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#e10600', background: 'rgba(225,6,0,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                          NEXT
                        </span>
                      )}
                      <ChevronRight
                        size={14}
                        color="#525252"
                        style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                      />
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expanded && (
                    <div className="slide-down" style={{
                      padding: '10px 14px 14px', margin: '0 6px 6px',
                      background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> {race.circuitName}, {race.country}
                        </div>
                        <div style={{ fontSize: 12, color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {formatRaceDate(race.date, race.time)} at {formatRaceTime(race.time)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadICS(race); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                          borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          background: 'rgba(225,6,0,0.1)', border: '1px solid rgba(225,6,0,0.2)',
                          color: '#e10600', fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(225,6,0,0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(225,6,0,0.1)'; }}
                      >
                        <Download size={12} /> Add to Calendar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </PageWrapper>
  );
}
