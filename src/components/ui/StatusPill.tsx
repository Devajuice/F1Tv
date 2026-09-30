import { Badge } from './Badge';
import type { BadgeTone } from './Badge';
import { cn } from '../../lib/cn';

interface StatusRule {
  test: RegExp;
  tone: BadgeTone;
  label?: string;
}

/**
 * Ergast status strings are free-form text ("Finished", "+1 Lap",
 * "Engine", "Accident", "Hydraulics", …). This classifies them into the four
 * buckets that matter on a results table, and keeps the substring map in one
 * place instead of spread across pages.
 */
const RULES: StatusRule[] = [
  { test: /^finished$/i, tone: 'good' },
  { test: /^\+\d+ laps?$/i, tone: 'good', label: '+1 Lap' },
  { test: /^(not classified|\+\d+ laps?)$/i, tone: 'done' },
  { test: /\b(1 lap|2 laps|laps?)\b/i, tone: 'done' },
  { test: /disqualif|\bdsq\b/i, tone: 'bad', label: 'DSQ' },
  { test: /\b(dns|did not start|did not qualify)\b/i, tone: 'bad' },
  { test: /retired/i, tone: 'warn', label: 'DNF' },
  { test: /(engine|gearbox|transmission|clutch|hydraulic|water|overheat|cooling|brake|tyre|tire|steering|undertr|rear wing|front wing|damage|collision|accident|mechanical|electrical|smoke|fire)/i, tone: 'warn' },
];

export function classifyStatus(status: string): {
  tone: BadgeTone;
  label: string;
} {
  const text = status.trim();
  for (const rule of RULES) {
    if (rule.test.test(text)) {
      return { tone: rule.tone, label: rule.label ?? text };
    }
  }
  return { tone: 'done', label: text };
}

/** Status pill. Shows the finishing time when the driver actually finished. */
export function StatusPill({
  status,
  time,
  className,
}: {
  status: string;
  time?: string;
  className?: string;
}) {
  const { tone, label } = classifyStatus(status);
  const showTime = Boolean(time) && tone !== 'bad' && tone !== 'warn';

  return (
    <Badge
      tone={tone}
      className={cn('max-w-full truncate normal-case', className)}
      title={label}
    >
      {showTime ? time : label}
    </Badge>
  );
}
