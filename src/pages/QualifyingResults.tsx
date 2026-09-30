import { useEffect, useMemo, useState } from 'react';
import { StopCircle } from 'lucide-react';
import {
  getQualifyingResult,
  getSchedule,
  type QualifyingResult,
  type Race,
} from '../api/f1Api';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getTeamColor } from '../data/teams';
import { formatLapTime, surname } from '../lib/format';
import { getRacesWithQualifying } from '../lib/races';
import { PageContainer, PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { RaceSelect } from '../components/ui/RaceSelect';
import { Tabs } from '../components/ui/Tabs';
import { DataTable, PositionCell, Td, Th, Tr } from '../components/ui/Table';
import { TeamDot } from '../components/ui/Badge';
import { Flag, TrackImage } from '../components/ui/Atoms';
import { EmptyState, ErrorState, RefreshHint } from '../components/ui/States';
import { SkeletonRows } from '../components/ui/Skeleton';
import { cn } from '../lib/cn';

/** Session result is near-final within a couple of minutes. */
const POLL = 30_000;

type Phase = 'all' | 'q3' | 'q2' | 'q1';

const PHASES: Array<{ value: Phase; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'q3', label: 'Q3' },
  { value: 'q2', label: 'Q2 out' },
  { value: 'q1', label: 'Q1 out' },
];

/** Which part of qualifying a driver reached. */
function phaseOf(r: QualifyingResult): Exclude<Phase, 'all'> {
  if (r.q3) return 'q3';
  if (r.q2) return 'q2';
  return 'q1';
}

const PHASE_TONE: Record<Exclude<Phase, 'all'>, string> = {
  q3: 'border-purple-fp/40 bg-purple-fp/12 text-purple-fp',
  q2: 'border-sodium/40 bg-sodium/12 text-sodium',
  q1: 'border-white/12 bg-white/5 text-mist-400',
};

export default function QualifyingResults() {
  useDocumentTitle('Qualifying');
  const [round, setRound] = useState('');
  const [phase, setPhase] = useState<Phase>('all');

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
        return getQualifyingResult(race.season, race.round);
      },
      [race?.season, race?.round],
      { intervalMs: POLL, enabled: Boolean(race) },
    );

  // Stable identity: `data ?? []` would allocate a new array every render and
  // defeat every memo below.
  const rows = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () => (phase === 'all' ? rows : rows.filter((r) => phaseOf(r) === phase)),
    [rows, phase],
  );

  const pole = rows[0];
  const counts = useMemo(
    () => ({
      all: rows.length,
      q3: rows.filter((r) => phaseOf(r) === 'q3').length,
      q2: rows.filter((r) => phaseOf(r) === 'q2').length,
      q1: rows.filter((r) => phaseOf(r) === 'q1').length,
    }),
    [rows],
  );

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <PageHeader
        eyebrow="Saturday session"
        title="Qualifying Results"
        description="Three knockout phases. Q3 sets the grid; drivers eliminated in Q2 or Q1 start from the back."
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
      >
        {rows.length > 0 && (
          <div className="mt-6">
            <Tabs
              items={PHASES.map((p) => ({
                ...p,
                hint: counts[p.value] ? String(counts[p.value]) : undefined,
              }))}
              value={phase}
              onChange={setPhase}
              accent={(v) =>
                v === 'q3'
                  ? 'var(--color-purple-fp)'
                  : v === 'q2'
                    ? 'var(--color-sodium)'
                    : v === 'q1'
                      ? 'var(--color-mist-400)'
                      : 'var(--color-f1-red)'
              }
              aria-label="Qualifying phase"
            />
          </div>
        )}
      </PageHeader>

      {/* ---- Pole sitter ---- */}
      {pole && (
        <Panel className="notched relative mb-4 overflow-hidden">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <TrackImage
              circuit={race?.locality ?? ''}
              round={race?.round}
              className="size-16 sm:size-20"
            />
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-2 flex items-center gap-2">
                <span className="accent-bar inline-block h-3 w-1.5" />
                Pole position
              </p>
              <h2 className="font-display text-xl leading-tight font-extrabold tracking-[-0.03em] text-mist-50 sm:text-2xl">
                {pole.driverName}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-2.5 text-[12px] text-mist-400">
                <TeamDot color={getTeamColor(pole.constructorName)} />
                {pole.constructorName}
                {race && (
                  <>
                    <span className="text-mist-600">·</span>
                    <Flag country={race.country} />
                    {race.raceName}
                  </>
                )}
              </p>
            </div>
            <div className="shrink-0 rounded-md border border-purple-fp/30 bg-purple-fp/10 px-5 py-3 sm:text-right">
              <p className="eyebrow mb-1.5 sm:justify-end">Q3 best</p>
              <p className="num text-2xl leading-none font-bold text-purple-fp">
                {formatLapTime(pole.q3 ?? pole.q2 ?? pole.q1)}
              </p>
            </div>
          </div>
        </Panel>
      )}

      {/* ---- Table ---- */}
      <Panel flush>
        {error ? (
          <ErrorState message={error.message} onRetry={refresh} />
        ) : loadingRaces || loading ? (
          <div className="p-5 sm:p-6">
            <SkeletonRows rows={10} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<StopCircle size={18} />}
            title="No qualifying data"
            description="Qualifying times appear here once the session has been published."
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th className="w-14">Pos</Th>
                <Th>Driver</Th>
                <Th className="hidden sm:table-cell">Team</Th>
                <Th className="hidden md:table-cell">Phase</Th>
                <Th align="right">Q1</Th>
                <Th align="right" className="hidden sm:table-cell">
                  Q2
                </Th>
                <Th align="right">Q3</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const phase = phaseOf(row);
                const best = row.q3 ?? row.q2 ?? row.q1;
                return (
                  <Tr key={row.driverId}>
                    <Td>
                      <PositionCell position={row.position} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <TeamDot color={getTeamColor(row.constructorName)} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-mist-50">
                            {surname(row.driverName)}
                          </p>
                          <p className="num mt-0.5 font-mono text-[10px] text-mist-500">
                            #{row.driverNumber}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="hidden sm:table-cell">
                      <span className="truncate text-[12px] text-mist-400">
                        {row.constructorName}
                      </span>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-xs border px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.1em] uppercase',
                          PHASE_TONE[phase],
                        )}
                      >
                        {phase.toUpperCase()}
                      </span>
                    </Td>
                    <Lap time={row.q1} best={best === row.q1 && Boolean(row.q1)} />
                    <Lap time={row.q2} best={best === row.q2 && Boolean(row.q2)} hideOnMobile />
                    <Lap time={row.q3} best={best === row.q3 && Boolean(row.q3)} />
                  </Tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Panel>
    </PageContainer>
  );
}

function Lap({
  time,
  best,
  hideOnMobile,
}: {
  time: string | null;
  best: boolean;
  hideOnMobile?: boolean;
}) {
  return (
    <Td
      align="right"
      className={cn('whitespace-nowrap', hideOnMobile && 'hidden sm:table-cell')}
    >
      {time ? (
        <span
          className={cn(
            'num text-[12.5px]',
            best ? 'font-bold text-purple-fp' : 'text-mist-300',
          )}
        >
          {formatLapTime(time)}
        </span>
      ) : (
        <span className="text-mist-600">—</span>
      )}
    </Td>
  );
}
