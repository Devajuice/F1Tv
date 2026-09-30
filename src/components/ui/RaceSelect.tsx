import { useMemo } from 'react';
import type { Race } from '../../api/f1Api';
import { Select, type SelectOption } from './Select';
import { countryFlag, formatDate, formatTimeZoned } from '../../lib/format';
import { getRaceStart, getRaceStatus, raceLabel } from '../../lib/races';

interface RaceSelectProps {
  races: Race[];
  /** The round currently selected. */
  value: string;
  onChange: (round: string) => void;
  label?: string;
  className?: string;
  /** How the availability of each race is determined. */
  filter?: 'finished' | 'qualifying';
  align?: 'start' | 'end';
}

/**
 * Round picker used by the results, qualifying and grid pages.
 *
 * Replaces three near-identical dropdown implementations, each of which
 * positioned itself with requestAnimationFrame + querySelector and had no
 * keyboard support.
 */
export function RaceSelect({
  races,
  value,
  onChange,
  label = 'Grand Prix',
  className,
  filter = 'finished',
  align = 'start',
}: RaceSelectProps) {
  const options = useMemo<SelectOption[]>(() => {
    const now = Date.now();
    return [...races]
      .sort((a, b) => Number(b.round) - Number(a.round))
      .map((race) => {
        const start = getRaceStart(race);
        const status = getRaceStatus(race, now);
        return {
          value: race.round,
          label: raceLabel(race),
          meta: `${formatDate(race.date)} · ${formatTimeZoned(start)}`,
          lead: (
            <span className="shrink-0 text-[13px] leading-none">
              {countryFlag(race.country)}
            </span>
          ),
          disabled: filter === 'finished' && status === 'upcoming',
        };
      });
  }, [races, filter]);

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      label={label}
      className={className}
      align={align}
      searchable={options.length > 8}
      emptyText="No races available"
    />
  );
}
