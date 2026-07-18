import { useMemo } from 'react';
import type { LapEntry, DriverInfo } from '../api/openf1';

interface FastestLapTabProps {
  laps: LapEntry[];
  drivers: Map<number, DriverInfo>;
}

interface FastestLapRow {
  rank: number;
  driverNumber: number;
  acronym: string;
  teamColour: string;
  lapNumber: number;
  lapTime: number;
  sector1: number | null;
  sector2: number | null;
  sector3: number | null;
  speedTrap: number | null;
  s1Best: number | null;
  s2Best: number | null;
  s3Best: number | null;
}

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toFixed(3).padStart(6, '0')}` : secs.toFixed(3);
}

function formatSector(seconds: number | null): string {
  if (seconds === null) return '-';
  return seconds.toFixed(3);
}

function getSectorColor(
  val: number | null,
  best: number | null,
  personalBest: number | null,
): string {
  if (val === null || best === null) return '#737373';
  if (val === best) return '#a855f7';
  if (personalBest !== null && val === personalBest) return '#22c55e';
  return '#eab308';
}

export default function FastestLapTab({ laps, drivers }: FastestLapTabProps) {
  const { fastest, totalLaps } = useMemo(() => {
    const byDriver = new Map<number, LapEntry[]>();
    for (const lap of laps) {
      const list = byDriver.get(lap.driver_number) ?? [];
      list.push(lap);
      byDriver.set(lap.driver_number, list);
    }

    const allValid = laps.filter((l) => l.lap_duration !== null);
    if (allValid.length === 0) return { fastest: [], totalLaps: allValid.length };

    allValid.sort((a, b) => (a.lap_duration ?? Infinity) - (b.lap_duration ?? Infinity));
    const top = allValid.slice(0, 10);
    const globalBestS1 = Math.min(...top.map((l) => l.duration_sector_1 ?? Infinity));
    const globalBestS2 = Math.min(...top.map((l) => l.duration_sector_2 ?? Infinity));
    const globalBestS3 = Math.min(...top.map((l) => l.duration_sector_3 ?? Infinity));

    const rows: FastestLapRow[] = top.map((lap, i) => {
      const driver = drivers.get(lap.driver_number);
      const s1Best = lap.duration_sector_1 === globalBestS1 ? lap.duration_sector_1 : null;
      const s2Best = lap.duration_sector_2 === globalBestS2 ? lap.duration_sector_2 : null;
      const s3Best = lap.duration_sector_3 === globalBestS3 ? lap.duration_sector_3 : null;
      return {
        rank: i + 1,
        driverNumber: lap.driver_number,
        acronym: driver?.name_acronym ?? String(lap.driver_number),
        teamColour: `#${driver?.team_colour ?? '737373'}`,
        lapNumber: lap.lap_number,
        lapTime: lap.lap_duration!,
        sector1: lap.duration_sector_1,
        sector2: lap.duration_sector_2,
        sector3: lap.duration_sector_3,
        speedTrap: lap.st_speed,
        s1Best,
        s2Best,
        s3Best,
      };
    });

    return { fastest: rows, totalLaps: allValid.length };
  }, [laps, drivers]);

  if (fastest.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#737373', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No lap data yet</p>
        <p style={{ fontSize: 12, margin: 0 }}>Fastest laps will appear once drivers complete laps</p>
      </div>
    );
  }

  return (
    <div style={{ overflow: 'auto', maxHeight: '50vh' }}>
      <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#737373' }}>{totalLaps} laps completed</span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {[
            { color: '#a855f7', label: 'Purple (best)' },
            { color: '#22c55e', label: 'Green' },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#525252' }}>
              <span style={{ width: 6, height: 6, borderRadius: 1, background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '32px 70px 1fr 48px 72px 64px 64px 64px 56px',
        alignItems: 'center', padding: '6px 12px', position: 'sticky', top: 0, zIndex: 2,
        background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {['#', 'Driver', '', 'Lap', 'Time', 'S1', 'S2', 'S3', 'Trp'].map((h) => (
          <span key={h} style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const,
            letterSpacing: '0.1em', color: '#525252',
            ...(h === 'Driver' ? { textAlign: 'left' as const } : { textAlign: 'center' as const }),
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {fastest.map((row, i) => (
        <div
          key={`${row.driverNumber}-${row.lapNumber}`}
          className="stagger-in"
          style={{
            display: 'grid', gridTemplateColumns: '32px 70px 1fr 48px 72px 64px 64px 64px 56px',
            alignItems: 'center', padding: '7px 12px',
            background: i === 0 ? 'rgba(225,6,0,0.05)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.02)',
          }}
        >
          {/* Rank */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 13, fontWeight: 800,
              color: i === 0 ? '#facc15' : '#737373',
            }}>{row.rank}</span>
          </div>

          {/* Driver */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: row.teamColour,
              background: `${row.teamColour}15`, padding: '2px 4px', borderRadius: 3,
              fontVariantNumeric: 'tabular-nums',
            }}>{row.driverNumber}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#d4d4d4' }}>{row.acronym}</span>
          </div>

          {/* Team bar */}
          <div style={{
            height: 3, borderRadius: 1.5, background: row.teamColour,
            opacity: 0.6, margin: '0 8px',
          }} />

          {/* Lap number */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#737373' }}>L{row.lapNumber}</span>
          </div>

          {/* Lap time */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: i === 0 ? '#facc15' : '#d4d4d4',
              fontVariantNumeric: 'tabular-nums',
            }}>{formatLapTime(row.lapTime)}</span>
          </div>

          {/* Sector 1 */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: getSectorColor(row.sector1, row.s1Best, null),
              fontVariantNumeric: 'tabular-nums',
            }}>{formatSector(row.sector1)}</span>
          </div>

          {/* Sector 2 */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: getSectorColor(row.sector2, row.s2Best, null),
              fontVariantNumeric: 'tabular-nums',
            }}>{formatSector(row.sector2)}</span>
          </div>

          {/* Sector 3 */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: getSectorColor(row.sector3, row.s3Best, null),
              fontVariantNumeric: 'tabular-nums',
            }}>{formatSector(row.sector3)}</span>
          </div>

          {/* Speed trap */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#737373',
              fontVariantNumeric: 'tabular-nums',
            }}>{row.speedTrap ?? '-'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
