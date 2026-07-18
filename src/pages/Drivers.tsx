import { useState, useEffect, useRef } from 'react';
import { Users, ChevronRight, Globe, Calendar, X } from 'lucide-react';
import { getDriverList, getDriverStandings } from '../api/f1Api';
import type { DriverProfile, DriverStanding } from '../api/f1Api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

const TEAM_COLORS: Record<string, string> = {
  'Red Bull Racing': '#3671C6', 'Mercedes': '#27F4D2', 'Ferrari': '#E8002D',
  'McLaren': '#FF8000', 'Aston Martin': '#229971', 'Alpine': '#FF87BC',
  'Williams': '#64C4FF', 'RB': '#6692FF', 'Kick Sauber': '#52E252',
  'Haas': '#B6BABD',
};

function getTeamColor(name: string): string {
  return TEAM_COLORS[name] ?? '#737373';
}

function getAge(dob: string): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return `${age}`;
}

const NATIONALITY_FLAGS: Record<string, string> = {
  British: '\u{1F1EC}\u{1F1E7}', Dutch: '\u{1F1F3}\u{1F1F1}', Australian: '\u{1F1E6}\u{1F1FA}', Monegasque: '\u{1F1F2}\u{1F1E8}',
  Spanish: '\u{1F1EA}\u{1F1F8}', Canadian: '\u{1F1E8}\u{1F1E6}', French: '\u{1F1EB}\u{1F1F7}', German: '\u{1F1E9}\u{1F1EA}',
  Japanese: '\u{1F1EF}\u{1F1F5}', Danish: '\u{1F1E9}\u{1F1F0}', Mexican: '\u{1F1F2}\u{1F1FD}', Finnish: '\u{1F1EB}\u{1F1EE}',
  Thai: '\u{1F1F9}\u{1F1ED}', Chinese: '\u{1F1E8}\u{1F1F3}', Brazilian: '\u{1F1E7}\u{1F1F7}', Argentine: '\u{1F1E6}\u{1F1F7}',
  Chilean: '\u{1F1E8}\u{1F1F1}', Colombian: '\u{1F1E8}\u{1F1F4}', 'New Zealander': '\u{1F1F3}\u{1F1FF}', Indian: '\u{1F1EE}\u{1F1F3}',
};

export default function Drivers() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getDriverList(), getDriverStandings()])
      .then(([d, s]) => { setDrivers(d); setStandings(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId && expandedRef.current) {
      expandedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  const getStanding = (driverId: string) => standings.find((s) => s.driverId === driverId);
  const selectedDriver = selectedId ? drivers.find((d) => d.driverId === selectedId) ?? null : null;

  return (
    <PageWrapper>
      <Header showBack backTo="/home" backLabel="Home" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1 className="fade-in-up" style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={22} color="#e10600" /> Drivers
        </h1>

        {/* Expanded Driver Card - rendered at top for visibility */}
        {selectedDriver && (() => {
          const color = getTeamColor(selectedDriver.teamName);
          const standing = getStanding(selectedDriver.driverId);
          return (
            <div ref={expandedRef} className="glass-strong scale-in" style={{
              borderRadius: 14, padding: 20, marginBottom: 16,
              borderLeft: `3px solid ${color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 900, color: '#fff',
                  background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                  border: `3px solid ${color}60`,
                }}>
                  {selectedDriver.driverNumber || '?'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                      {selectedDriver.firstName} {selectedDriver.lastName}
                    </h2>
                    <button
                      onClick={() => setSelectedId(null)}
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6,
                        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#737373',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#a3a3a3' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                      {selectedDriver.teamName}
                    </span>
                    {standing && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#e10600', background: 'rgba(225,6,0,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                        P{standing.positionText} &middot; {standing.points} pts &middot; {standing.wins} wins
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                    <InfoItem icon={<Globe size={11} />} label="Nationality" value={`${NATIONALITY_FLAGS[selectedDriver.nationality] ?? ''} ${selectedDriver.nationality ?? '-'}`} />
                    <InfoItem icon={<Calendar size={11} />} label="Date of Birth" value={selectedDriver.dateOfBirth ? new Date(selectedDriver.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '-'} />
                    <InfoItem icon={null} label="Age" value={selectedDriver.dateOfBirth ? getAge(selectedDriver.dateOfBirth) : '-'} />
                  </div>

                  {selectedDriver.url && (
                    <a
                      href={selectedDriver.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12,
                        fontSize: 12, color: '#e10600', textDecoration: 'none', fontWeight: 600,
                      }}
                    >
                      Wikipedia &rarr;
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="glass" style={{ borderRadius: 14, padding: 16, display: 'flex', gap: 12 }}>
                <div className="skeleton skeleton-circle" style={{ width: 48, height: 48 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton skeleton-text" style={{ width: '60%', height: 14 }} />
                  <div className="skeleton skeleton-text" style={{ width: '40%', height: 10 }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {drivers.map((driver, i) => {
              const standing = getStanding(driver.driverId);
              const color = getTeamColor(driver.teamName);
              const flag = NATIONALITY_FLAGS[driver.nationality] ?? '\u{1F3C1}';
              const isSelected = selectedId === driver.driverId;
              return (
                <button
                  key={driver.driverId}
                  type="button"
                  className="glass glass-hover stagger-in"
                  onClick={() => setSelectedId(isSelected ? null : driver.driverId)}
                  style={{
                    borderRadius: 14, padding: 16, cursor: 'pointer', border: isSelected ? `1px solid ${color}60` : '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' as const,
                    fontFamily: 'inherit', width: '100%',
                    background: isSelected ? `${color}10` : 'rgba(255,255,255,0.04)',
                    animationDelay: `${Math.min(i * 0.03, 0.3)}s`,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0,
                    background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                    border: `2px solid ${color}40`,
                  }}>
                    {driver.driverNumber || '?'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{driver.lastName}</span>
                      {standing && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#737373', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4 }}>
                          P{standing.positionText}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#737373', marginTop: 1 }}>{driver.firstName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#525252' }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                        {driver.teamName}
                      </span>
                      <span style={{ fontSize: 11, color: '#525252' }}>{flag} {driver.nationality}</span>
                    </div>
                  </div>

                  <ChevronRight size={14} color={isSelected ? color : '#525252'} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </PageWrapper>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#525252', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 2 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#d4d4d4' }}>{value}</div>
    </div>
  );
}
