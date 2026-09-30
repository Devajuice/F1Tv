import { useEffect, useMemo, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import {
  getGridLineup,
  getSchedule,
  type QualifyingResult,
  type Race,
} from '../api/f1Api';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getTeamColor } from '../data/teams';
import { formatLapTime, initials, surname } from '../lib/format';
import { getRacesWithQualifying } from '../lib/races';
import { PageContainer, PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { RaceSelect } from '../components/ui/RaceSelect';
import { EmptyState, ErrorState, RefreshHint } from '../components/ui/States';
import { SkeletonRows } from '../components/ui/Skeleton';
import { Flag, TrackImage } from '../components/ui/Atoms';
import { cn } from '../lib/cn';

const POLL = 30_000;

/**
 * Starting grid.
 *
 * Keeps the staggered two-column track formation on desktop — it is the most
 * distinctive view on the site — and falls back to a flat list on mobile.
 */
export default function GridLineup() {
  useDocumentTitle('Starting Grid');
  const [round, setRound] = useState('');

  const { data: races, loading: loadingRaces } = useAsync<Race[]>(
    () => getSchedule(),
    [],
  );

  const withQuali = useMemo(() => getRacesWithQualifying(races ?? []), [races]);

  useEffect(() => {
    if (round || withQuali.length === 0) return;
    setRound(withQuali[withQuali.length - 1].round);
  }, [withQuali, round]);

  const race = withQuali.find((r) => r.round === round) ?? null;

  const { data, loading, error, refresh, refreshing, lastFetchedAt } =
    useAsync<QualifyingResult[]>(
      async () => {
        if (!race) return [];
        return getGridLineup(race.season, race.round);
      },
      [race?.season, race?.round],
      { intervalMs: POLL, enabled: Boolean(race) },
    );

  const grid = useMemo(() => data ?? [], [data]);
  // Pair front row then the rest: 1|2, 3|4, 5|6 …
  const rows = useMemo(() => {
    const pairs: Array<[QualifyingResult | undefined, QualifyingResult | undefined]> = [];
    for (let i = 0; i < grid.length; i += 2) {
      pairs.push([grid[i], grid[i + 1]]);
    }
    return pairs;
  }, [grid]);

  const pole = grid[0];

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <PageHeader
        eyebrow="Race day"
        title="Starting Grid"
        description="Grid positions as set by qualifying. Front row, then the rest of the field in formation order."
        actions={
          <>
            <div className="w-full min-w-56 sm:w-72">
              <RaceSelect
                races={withQuali}
                value={round}
                onChange={setRound}
                label="Grand Prix"
              />
            </div>
            <RefreshHint at={lastFetchedAt} onRefresh={refresh} busy={refreshing} />
          </>
        }
      />

      {pole && race && (
        <Panel className="notched relative mb-4 overflow-hidden">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <TrackImage circuit={race.locality} round={race.round} className="size-16 sm:size-20" />
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-2 flex items-center gap-2">
                <span className="accent-bar inline-block h-3 w-1.5" />
                Pole sitter
              </p>
              <h2 className="font-display text-xl leading-tight font-extrabold tracking-[-0.03em] text-mist-50 sm:text-2xl">
                {pole.driverName}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-2.5 text-[12px] text-mist-400">
                <Flag country={race.country} />
                {race.circuitName}
                <span className="text-mist-600">·</span>
                {race.raceName}
              </p>
            </div>
            <div className="shrink-0 rounded-md border border-sodium/30 bg-sodium/10 px-5 py-3 sm:text-right">
              <p className="eyebrow mb-1.5 sm:justify-end">Pole time</p>
              <p className="num text-2xl leading-none font-bold text-sodium">
                {formatLapTime(pole.q3 ?? pole.q2 ?? pole.q1)}
              </p>
            </div>
          </div>
        </Panel>
      )}

      <Panel flush>
        {error ? (
          <ErrorState message={error.message} onRetry={refresh} />
        ) : loadingRaces || loading ? (
          <div className="p-5 sm:p-6">
            <SkeletonRows rows={10} />
          </div>
        ) : grid.length === 0 ? (
          <EmptyState
            icon={<Grid3x3 size={18} />}
            title="Grid not set"
            description="The starting grid appears once qualifying has been completed and classified."
          />
        ) : (
          <div className="p-4 sm:p-6">
            {/* ---- Start line ---- */}
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-linear-to-r from-transparent via-white/20 to-transparent" />
              <span className="font-mono text-[9.5px] font-semibold tracking-[0.24em] text-mist-500 uppercase">
                Start
              </span>
              <span className="h-px flex-1 bg-linear-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* ---- Track formation (desktop) ---- */}
            <div className="hidden max-w-2xl flex-col gap-1.5 md:flex">
              {rows.map(([left, right], rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-[1fr_44px_1fr] items-stretch"
                >
                  <div className="flex justify-end">
                    {left && <Slot entry={left} side="left" />}
                  </div>
                  <div className="relative">
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-linear-to-b from-white/18 to-transparent"
                    />
                    <span className="num absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center font-mono text-[10px] text-mist-600">
                      {left && right ? rowIndex + 1 : ''}
                    </span>
                  </div>
                  <div className={cn('flex justify-start', rowIndex % 2 === 0 && 'mt-3.5')}>
                    {right && <Slot entry={right} side="right" />}
                  </div>
                </div>
              ))}
            </div>

            {/* ---- Flat list (mobile) ---- */}
            <ul className="flex flex-col gap-1.5 md:hidden">
              {grid.map((entry) => (
                <li key={entry.driverId}>
                  <Slot entry={entry} side="flat" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
    </PageContainer>
  );
}

function Slot({
  entry,
  side,
}: {
  entry: QualifyingResult;
  side: 'left' | 'right' | 'flat';
}) {
  const color = getTeamColor(entry.constructorName);
  const pole = entry.position === '1';
  const best = entry.q3 ?? entry.q2 ?? entry.q1;

  return (
    <div
      className={cn(
        'group relative flex w-full items-center gap-2.5 overflow-hidden rounded-sm border py-2 pr-3 pl-2.5 transition-colors',
        pole
          ? 'border-sodium/45 bg-sodium/8'
          : 'border-white/8 bg-white/[0.025] hover:border-white/16 hover:bg-white/[0.05]',
        side === 'left' && 'flex-row text-right',
        side === 'flat' && 'max-w-md',
      )}
    >
      {/* Livery stripe on the outboard edge. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 w-0.5',
          side === 'right' ? 'right-0' : 'left-0',
        )}
        style={{ backgroundColor: color }}
      />

      <span
        className={cn(
          'num flex size-9 shrink-0 items-center justify-center rounded-xs border font-mono text-[12px] font-bold',
          pole
            ? 'border-sodium/45 bg-sodium/12 text-sodium'
            : 'border-white/10 bg-white/5 text-mist-300',
        )}
      >
        {String(entry.position).padStart(2, '0')}
      </span>

      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-black text-ink-950',
          side === 'left' && 'order-first',
        )}
        style={{ backgroundColor: color }}
        title={entry.driverName}
      >
        {initials(entry.driverName)}
      </span>

      <span className={cn('min-w-0 flex-1', side === 'left' && 'text-right')}>
        <span className="block truncate text-[12.5px] font-semibold text-mist-50">
          {surname(entry.driverName)}
        </span>
        <span className="block truncate font-mono text-[9.5px] text-mist-500">
          {entry.constructorName}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="num block text-[11.5px] font-semibold text-mist-200">
          {formatLapTime(best)}
        </span>
        <span className="num block font-mono text-[9px] text-mist-600">
          #{entry.driverNumber}
        </span>
      </span>
    </div>
  );
}
