import { useState, useEffect, useRef } from 'react';
import { Radio } from 'lucide-react';
import type { RaceControlMessage } from '../api/openf1';
import { getRaceControl, getDrivers } from '../api/openf1';
import type { DriverInfo } from '../api/openf1';

interface Props {
  sessionKey: number;
}

function getFlagStyle(flag: string | null, category: string): { color: string; bg: string } {
  if (!flag) return { color: '#737373', bg: 'rgba(255,255,255,0.04)' };
  const f = flag.toUpperCase();
  if (f === 'GREEN') return { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' };
  if (f === 'RED') return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
  if (f === 'YELLOW') return { color: '#eab308', bg: 'rgba(234,179,8,0.08)' };
  if (f === 'DOUBLE YELLOW') return { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
  if (f === 'CHEQUERED') return { color: '#fff', bg: 'rgba(255,255,255,0.08)' };
  if (f === 'BLACK AND WHITE') return { color: '#a3a3a3', bg: 'rgba(255,255,255,0.04)' };
  if (f === 'BLUE') return { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' };
  if (category === 'SafetyCar') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  if (category === 'SessionStatus') return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' };
  return { color: '#737373', bg: 'rgba(255,255,255,0.04)' };
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function RaceControlFeed({ sessionKey }: Props) {
  const [messages, setMessages] = useState<RaceControlMessage[]>([]);
  const [drivers, setDrivers] = useState<Map<number, DriverInfo>>(new Map());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDrivers(sessionKey).then(setDrivers).catch(() => {});
  }, [sessionKey]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetch = () => {
      if (cancelled) return;
      getRaceControl(sessionKey).then((msgs) => {
        if (!cancelled) setMessages(msgs);
      }).catch(() => {});
    };

    fetch();
    timer = setInterval(fetch, 10000);
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [sessionKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#737373', gap: 8 }}>
        <Radio size={24} color="#525252" />
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No race control messages</p>
        <p style={{ fontSize: 12, margin: 0 }}>Flags, safety car, and incidents will appear here</p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '50vh', overflowY: 'auto', padding: '8px 0' }}>
      {[...messages].reverse().map((msg, i) => {
        const style = getFlagStyle(msg.flag, msg.category);
        const driver = msg.driver_number ? drivers.get(msg.driver_number) : null;
        return (
          <div key={`${msg.date}-${i}`} className="stagger-in" style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '8px 14px',
            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.02)',
            animationDelay: `${Math.min(i * 0.02, 0.3)}s`,
          }}>
            {/* Time */}
            <span style={{ fontSize: 11, color: '#525252', fontVariantNumeric: 'tabular-nums', minWidth: 60, flexShrink: 0 }}>
              {formatTime(msg.date)}
            </span>

            {/* Flag badge */}
            {msg.flag && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: style.color,
                background: style.bg, padding: '2px 6px', borderRadius: 4,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {msg.flag}
              </span>
            )}

            {/* Driver */}
            {driver && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: `#${driver.team_colour}`,
                background: `#${driver.team_colour}15`,
                padding: '2px 5px', borderRadius: 3, flexShrink: 0,
              }}>
                {driver.name_acronym}
              </span>
            )}

            {/* Lap */}
            {msg.lap_number && (
              <span style={{ fontSize: 10, color: '#525252', flexShrink: 0 }}>
                L{msg.lap_number}
              </span>
            )}

            {/* Message */}
            <span style={{ fontSize: 12, color: '#d4d4d4', lineHeight: 1.4, flex: 1 }}>
              {msg.message}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
