import { useMemo } from 'react';
import type { DriverInfo } from '../api/openf1';

interface TrackMapTabProps {
  locations: Map<number, { x: number; y: number }>;
  drivers: Map<number, DriverInfo>;
}

interface CarDot {
  driverNumber: number;
  acronym: string;
  teamColour: string;
  x: number;
  y: number;
}

export default function TrackMapTab({ locations, drivers }: TrackMapTabProps) {
  const { cars, bounds, totalDrivers } = useMemo(() => {
    const list: CarDot[] = [];
    locations.forEach((loc, driverNum) => {
      const driver = drivers.get(driverNum);
      list.push({
        driverNumber: driverNum,
        acronym: driver?.name_acronym ?? String(driverNum),
        teamColour: `#${driver?.team_colour ?? '737373'}`,
        x: loc.x,
        y: loc.y,
      });
    });

    if (list.length === 0) return { cars: [], bounds: null, totalDrivers: 0 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of list) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    return {
      cars: list,
      bounds: { minX, maxX, minY, maxY, rangeX, rangeY },
      totalDrivers: list.length,
    };
  }, [locations, drivers]);

  if (cars.length === 0 || !bounds) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#737373', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No track data</p>
        <p style={{ fontSize: 12, margin: 0 }}>Car positions will appear during a live session</p>
      </div>
    );
  }

  const padding = 40;
  const svgW = 400;
  const svgH = 280;

  const toSvgX = (x: number) => padding + ((x - bounds.minX) / bounds.rangeX) * (svgW - padding * 2);
  const toSvgY = (y: number) => padding + ((y - bounds.minY) / bounds.rangeY) * (svgH - padding * 2);

  return (
    <div style={{ padding: '8px 0' }}>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ width: '100%', height: 'auto', maxHeight: '50vh' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect x="0" y="0" width={svgW} height={svgH} fill="#0a0a0a" rx="8" />

        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const x = padding + (i / 4) * (svgW - padding * 2);
          const y = padding + (i / 4) * (svgH - padding * 2);
          return (
            <g key={i}>
              <line x1={x} y1={padding} x2={x} y2={svgH - padding} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              <line x1={padding} y1={y} x2={svgW - padding} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            </g>
          );
        })}

        {/* Car dots */}
        {cars.map((car) => {
          const cx = toSvgX(car.x);
          const cy = toSvgY(car.y);
          return (
            <g key={car.driverNumber}>
              {/* Glow */}
              <circle cx={cx} cy={cy} r="8" fill={car.teamColour} opacity="0.15" />
              {/* Outer ring */}
              <circle cx={cx} cy={cy} r="5" fill="none" stroke={car.teamColour} strokeWidth="1.5" opacity="0.6" />
              {/* Inner dot */}
              <circle cx={cx} cy={cy} r="2.5" fill={car.teamColour} />
              {/* Driver number label */}
              <text
                x={cx}
                y={cy - 9}
                textAnchor="middle"
                fill="#fff"
                fontSize="7"
                fontWeight="700"
                fontFamily="inherit"
              >
                {car.driverNumber}
              </text>
            </g>
          );
        })}

        {/* Title */}
        <text x={svgW / 2} y="18" textAnchor="middle" fill="#525252" fontSize="9" fontWeight="600" fontFamily="inherit">
          LIVE TRACK POSITIONS ({totalDrivers} drivers)
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center', marginTop: 8, padding: '0 12px' }}>
        {Array.from(drivers.entries()).slice(0, 20).map(([num, d]) => (
          <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: `#${d.team_colour}`, display: 'inline-block',
            }} />
            <span style={{ fontSize: 9, color: '#525252' }}>
              {d.name_acronym}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
