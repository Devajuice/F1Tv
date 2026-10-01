import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, ChevronDown, MapPin } from 'lucide-react';
import { getSchedule, type Race } from '../api/f1Api';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  formatDate,
  formatLongDate,
  formatTimeZoned,
  joinDateTime,
  relativeDayLabel,
} from '../lib/format';
import { getRaceStart, getRaceStatus } from '../lib/races';
import { useTimeZone } from '../context/TimeZoneContext';
import { Button } from '../components/ui/Button';
import { Badge, LiveDot } from '../components/ui/Badge';
import { Flag } from '../components/ui/Atoms';
import { TrackMap } from '../components/ui/TrackMap';
import { CountdownStat } from '../components/ui/Countdown';
import { PageContainer, PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { EmptyState, ErrorState } from '../components/ui/States';
import { SkeletonRows } from '../components/ui/Skeleton';
import { Tabs } from '../components/ui/Tabs';
import { cn } from '../lib/cn';

type Filter = 'all' | 'upcoming' | 'completed';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All rounds' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

export default function RaceCalendar() {
  useDocumentTitle('Race Calendar');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: races, loading, error, refresh } = useAsync(() => getSchedule(), []);
  useTimeZone();

  const now = Date.now();
  const nextRace = useMemo(
    () => (races ?? []).find((r) => getRaceStatus(r, now) !== 'completed') ?? null,
    [races, now],
  );

  const visible = useMemo(() => {
    const list = races ?? [];
    if (filter === 'all') return list;
    return list.filter((r) =>
      filter === 'upcoming'
        ? getRaceStatus(r, now) !== 'completed'
        : getRaceStatus(r, now) === 'completed',
    );
  }, [races, filter, now]);

  const counts = useMemo(() => {
    const list = races ?? [];
    return {
      all: list.length,
      upcoming: list.filter((r) => getRaceStatus(r, now) !== 'completed').length,
      completed: list.filter((r) => getRaceStatus(r, now) === 'completed').length,
    };
  }, [races, now]);

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <PageHeader
        eyebrow={`${new Date().getFullYear()} Season`}
        title="Race Calendar"
        description="Every round of the championship with circuit layouts, local start times, and one-click calendar export."
        actions={
          <Tabs
            items={FILTERS.map((f) => ({ ...f, hint: String(counts[f.value]) }))}
            value={filter}
            onChange={setFilter}
            size="sm"
            aria-label="Filter rounds"
          />
        }
      />

      {/* ---- Next race feature ---- */}
      {nextRace && (
        <Panel className="notched relative mb-4 overflow-hidden">
          <div aria-hidden className="speedlines pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <TrackMap circuit={nextRace.locality} round={nextRace.round} className="size-20 sm:size-24" />
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-2 flex items-center gap-2">
                <span className="accent-bar inline-block h-3 w-1.5" />
                Next race · Round {Number(nextRace.round)}
              </p>
              <h2 className="font-display text-2xl leading-tight font-extrabold tracking-[-0.03em] text-mist-50 sm:text-3xl">
                {nextRace.raceName}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-mist-400">
                <Flag country={nextRace.country} />
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={11} />
                  {nextRace.circuitName}, {nextRace.locality}
                </span>
              </p>
              <p className="mt-3 font-mono text-[12px] text-mist-300">
                {formatLongDate(nextRace.date)} · {formatTimeZoned(getRaceStart(nextRace))}
              </p>
            </div>
            <div className="shrink-0 sm:text-right">
              <CountdownStat target={getRaceStart(nextRace)} label="to lights out" />
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => downloadICS(nextRace)}
              >
                <CalendarPlus size={12} />
                Add
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* ---- Round list ---- */}
      <Panel flush>
        {error ? (
          <ErrorState message={error.message} onRetry={refresh} />
        ) : loading ? (
          <div className="p-5 sm:p-6">
            <SkeletonRows rows={8} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title="Nothing here"
            description={
              filter === 'upcoming'
                ? 'Every round on the calendar has been run.'
                : filter === 'completed'
                  ? 'No completed rounds yet this season.'
                  : 'The calendar has not been published.'
            }
            action={
              filter !== 'all' && (
                <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                  Show all rounds
                </Button>
              )
            }
          />
        ) : (
          <ul>
            {visible.map((race) => (
              <RaceRow
                key={race.round}
                race={race}
                isNext={race.round === nextRace?.round}
                expanded={expanded === race.round}
                onToggle={() =>
                  setExpanded((e) => (e === race.round ? null : race.round))
                }
                now={now}
                totalRounds={counts.all}
              />
            ))}
          </ul>
        )}
      </Panel>
    </PageContainer>
  );
}

function RaceRow({
  race,
  isNext,
  expanded,
  onToggle,
  now,
  totalRounds,
}: {
  race: Race;
  isNext: boolean;
  expanded: boolean;
  onToggle: () => void;
  now: number;
  /** Rounds in the season, so the row can say "3 of 24". */
  totalRounds: number;
}) {
  const status = getRaceStatus(race, now);
  const start = getRaceStart(race);
  const zone = useTimeZone();
  // Circuit-local when the viewer asked for it, otherwise the ambient default.
  const tz = { timeZone: zone.resolve(race.locality) };

  return (
    <li className="border-b border-line/[0.05] last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          'group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors sm:gap-4 sm:px-6',
          expanded ? 'bg-veil/[0.03]' : 'hover:bg-veil/[0.025]',
        )}
      >
        <span className="num w-7 shrink-0 text-[13px] font-bold text-mist-500 transition-colors group-hover:text-mist-300">
          {String(Number(race.round)).padStart(2, '0')}
        </span>

        <TrackMap circuit={race.locality} round={race.round} className="size-11 shrink-0" />

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <Flag country={race.country} />
            <span className="truncate text-[13.5px] font-semibold text-mist-50">
              {race.raceName}
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10.5px] text-mist-500">
            <span className="truncate">{race.circuitName}</span>
            <span className="text-mist-600">·</span>
            <span className="whitespace-nowrap">
              {formatDate(start ?? race.date, tz)} ·{' '}
              {formatTimeZoned(start, tz).split(' ')[0]}
            </span>
          </span>
        </span>

        <span className="hidden w-24 shrink-0 text-right sm:block">
          <span className="block font-mono text-[10.5px] text-mist-400">
            {relativeDayLabel(start ?? race.date, now, tz)}
          </span>
        </span>

        {status === 'live' ? (
          <LiveDot label="Live" className="shrink-0" />
        ) : status === 'completed' ? (
          <Badge tone="done" className="shrink-0">
            Done
          </Badge>
        ) : isNext ? (
          <Badge tone="live" className="shrink-0">
            Next
          </Badge>
        ) : (
          <span className="num hidden shrink-0 font-mono text-[10px] text-mist-600 sm:block">
            R{race.round}
          </span>
        )}

        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-mist-500 transition-transform duration-300 ease-expo',
            expanded && 'rotate-180 text-mist-300',
          )}
        />
      </button>

      {expanded && (
        <div className="animate-slide-down grid gap-5 bg-ink-900/40 px-4 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:px-6">
          <TrackMap
            circuit={race.locality}
            round={race.round}
            className="hidden size-28 sm:block"
          />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px] sm:max-w-md">
            <div>
              <dt className="eyebrow mb-1.5">Circuit</dt>
              <dd className="text-mist-200">
                {race.circuitName}
                <span className="mt-0.5 block text-[11px] text-mist-500">
                  {race.locality}, {race.country}
                </span>
              </dd>
            </div>
            <div>
              <dt className="eyebrow mb-1.5">Start</dt>
              <dd className="text-mist-200">
                {formatDate(start ?? race.date)}
                <span className="mt-0.5 block font-mono text-[11px] text-mist-400">
                  {formatTimeZoned(start)} your time
                </span>
              </dd>
            </div>
            {race.qualifyingDate && (
              <div>
                <dt className="eyebrow mb-1.5">Qualifying</dt>
                <dd className="text-mist-200">
                  {formatDate(
                    joinDateTime(race.qualifyingDate, race.qualifyingTime),
                    tz,
                  )}
                  <span className="mt-0.5 block font-mono text-[11px] text-mist-400">
                    {formatTimeZoned(
                      joinDateTime(race.qualifyingDate, race.qualifyingTime),
                      tz,
                    )}
                  </span>
                </dd>
              </div>
            )}
            <div>
              <dt className="eyebrow mb-1.5">Round</dt>
              <dd className="text-mist-200">
                {Number(race.round)} of {totalRounds}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button size="sm" variant="secondary" onClick={() => downloadICS(race)}>
              <CalendarPlus size={12} />
              Add to calendar
            </Button>
            {status === 'completed' && (
              <Link
                to={`/results?round=${race.round}`}
                className="inline-flex h-8 items-center gap-2 rounded-sm border border-line/12 bg-veil/5 px-3 text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap text-mist-100 uppercase transition-colors hover:border-line/25 hover:bg-veil/9"
              >
                Result
              </Link>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/* -------------------------------------------------------------------------
   .ics export
   RFC 5547 requires CRLF line endings and UTC timestamps; a Grand Prix is
   booked as a two-hour block from lights out.
   ------------------------------------------------------------------------- */

function icsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function downloadICS(race: Race): void {
  const start = getRaceStart(race) ?? new Date(`${race.date}T12:00:00Z`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//F1TV//Race Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${race.season}-${race.round}-${race.circuitId}@f1tv`,
    `DTSTAMP:${icsTimestamp(new Date())}`,
    `DTSTART:${icsTimestamp(start)}`,
    `DTEND:${icsTimestamp(end)}`,
    `SUMMARY:${escapeICS(`${race.raceName} — Formula 1`)}`,
    `LOCATION:${escapeICS(`${race.circuitName}, ${race.locality}, ${race.country}`)}`,
    `DESCRIPTION:${escapeICS(
      `Round ${race.round} of the ${race.season} Formula 1 World Championship.`,
    )}`,
    `URL:${escapeICS(`https://www.formula1.com/en/racing/${race.season}/races`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(race.raceName)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `f1-${race.season}-r${Number(race.round).toString().padStart(2, '0')}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
