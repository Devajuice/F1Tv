import { useMemo } from 'react';
import type { DriverInfo, CarDataEntry } from '../api/openf1';

interface LiveTimingTabProps {
  positions: Map<number, number>;
  intervals: Map<number, { gap: string | number | null; interval: string | number | null }>;
  drivers: Map<number, DriverInfo>;
  carData: Map<number, CarDataEntry>;
}

interface TimingRow {
  position: number;
  driverNumber: number;
  acronym: string;
  teamColour: string;
  teamName: string;
  speed: number;
  gear: number;
  throttle: number;
  brake: boolean;
  drs: boolean;
  gap: string;
  interval: string;
}

function formatGap(val: string | number | null): string {
  if (val === null) return 'LEADER';
  if (typeof val === 'string') return val;
  return val.toFixed(1) + 's';
}

export default function LiveTimingTab({ positions, intervals, drivers, carData }: LiveTimingTabProps) {
  const rows = useMemo(() => {
    const result: TimingRow[] = [];
    positions.forEach((pos, driverNum) => {
      const driver = drivers.get(driverNum);
      const car = carData.get(driverNum);
      const intv = intervals.get(driverNum);
      result.push({
        position: pos,
        driverNumber: driverNum,
        acronym: driver?.name_acronym ?? String(driverNum),
        teamColour: `#${driver?.team_colour ?? '737373'}`,
        teamName: driver?.team_name ?? '',
        speed: car?.speed ?? 0,
        gear: car?.n_gear ?? 0,
        throttle: car?.throttle ?? 0,
        brake: (car?.brake ?? 0) > 0,
        drs: (car?.drs ?? 0) >= 10,
        gap: formatGap(intv?.gap ?? null),
        interval: formatGap(intv?.interval ?? null),
      });
    });
    return result.sort((a, b) => a.position - b.position);
  }, [positions, intervals, drivers, carData]);

  if (rows.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#737373', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No live timing data</p>
        <p style={{ fontSize: 12, margin: 0 }}>Data will appear during a live session</p>
      </div>
    );
  }

  return (
    <div style={{ overflow: 'auto', maxHeight: '50vh' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '40px 70px 1fr 60px 40px 50px 14px 70px',
        alignItems: 'center', padding: '8px 12px', position: 'sticky', top: 0, zIndex: 2,
        background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {['Pos', 'Driver', '', 'Speed', 'Gear', 'Thr', 'Brk', 'Gap'].map((h) => (
          <span key={h} style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const,
            letterSpacing: '0.1em', color: '#525252',
            ...(h === 'Driver' ? { textAlign: 'left' as const } : { textAlign: 'center' as const }),
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div
          key={row.driverNumber}
          className="stagger-in"
          style={{
            display: 'grid', gridTemplateColumns: '40px 70px 1fr 60px 40px 50px 14px 70px',
            alignItems: 'center', padding: '7px 12px',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.02)',
            transition: 'background 0.3s',
          }}
        >
          {/* Position */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            <span style={{
              display: 'inline-block', width: 3, height: 16, borderRadius: 2,
              background: row.position === 1 ? '#facc15' : row.teamColour,
              opacity: row.position <= 3 ? 1 : 0.4,
            }} />
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: row.position === 1 ? '#facc15' : '#d4d4d4',
            }}>{row.position}</span>
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

          {/* Team colour bar */}
          <div style={{
            height: 3, borderRadius: 1.5, background: row.teamColour,
            opacity: 0.6, margin: '0 8px',
          }} />

          {/* Speed */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#d4d4d4',
              fontVariantNumeric: 'tabular-nums',
            }}>{row.speed}</span>
            <span style={{ fontSize: 8, color: '#525252', marginLeft: 1 }}>km/h</span>
          </div>

          {/* Gear */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 14, fontWeight: 800, color: row.gear === 0 ? '#525252' : '#fff',
              fontVariantNumeric: 'tabular-nums',
            }}>{row.gear}</span>
          </div>

          {/* Throttle */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 36, height: 6, borderRadius: 3,
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden', display: 'inline-block',
            }}>
              <div style={{
                width: `${row.throttle}%`, height: '100%',
                background: row.throttle > 80 ? '#22c55e' : row.throttle > 30 ? '#eab308' : '#737373',
                borderRadius: 3, transition: 'width 0.15s',
              }} />
            </div>
          </div>

          {/* Brake */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: 2,
              background: row.brake ? '#ef4444' : 'rgba(255,255,255,0.06)',
              transition: 'background 0.1s',
            }} />
          </div>

          {/* Gap */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: row.gap === 'LEADER' ? '#facc15' : '#737373',
              fontVariantNumeric: 'tabular-nums',
            }}>{row.gap}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
