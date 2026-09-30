import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Minus, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import {
  getRaceResult,
  getSprintResult,
  getSchedule,
  type Race,
  type RaceResult,
} from '../api/f1Api';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getTeamColor } from '../data/teams';
import { formatNumber, positionDelta, surname } from '../lib/format';
import { getCompletedRaces, getRaceStart } from '../lib/races';
import { PageContainer, PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { RaceSelect } from '../components/ui/RaceSelect';
import { Tabs } from '../components/ui/Tabs';
import { DataTable, PositionCell, Td, Th, Tr } from '../components/ui/Table';
import { TeamDot } from '../components/ui/Badge';
import { StatusPill } from '../components/ui/StatusPill';
import { Flag, TrackImage } from '../components/ui/Atoms';
import { EmptyState, ErrorState, RefreshHint } from '../components/ui/States';
import { SkeletonRows } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

/** Results settle within a few minutes of the flag. */
const POLL = 60_000;

type Tab = 'race' | 'sprint';

export default function RaceResults() {
  useDocumentTitle('Race Results');
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('race');
  const [round, setRound] = useState<string>('');

  /* --- Which rounds are selectable, and which had a sprint? --- */
  const { data: races, loading: loadingRaces } = useAsync<Race[]>(
    () => getSchedule(),
    [],
  );

  const completed = useMemo(() => getCompletedRaces(races ?? []), [races]);

  // Default to the most recent completed round, but honour ?round= from the
  // calendar page.
  useEffect(() => {
    if (round || completed.length === 0) return;
    const requested = params.get('round');
    const target =
      requested && completed.some((r) => r.round === requested)
        ? requested
        : completed[completed.length - 1].round;
    setRound(target);
    if (requested) {
      params.delete('round');
      setParams(params, { replace: true });
    }
  }, [completed, round, params, setParams]);

  const race = completed.find((r) => r.round === round) ?? null;

  /* --- Data for the active tab. Only the visible one is requested, so a
  sprint weekend costs exactly one extra request. --- */
  const raceData = useAsync<RaceResult[]>(
    async () => {
      if (!race) return [];
      const full = await getRaceResult(race.season, race.round);
      return full?.results ?? [];
    },
    [race?.season, race?.round],
    { intervalMs: POLL, enabled: Boolean(race) && tab === 'race' },
  );

  const sprintData = useAsync<RaceResult[]>(
    async () => {
      if (!race) return [];
      return getSprintResult(race.season, race.round);
    },
    [race?.season, race?.round],
    { intervalMs: POLL, enabled: Boolean(race) && tab === 'sprint' },
  );

  const active = tab === 'sprint' ? sprintData : raceData;
  const rows = useMemo(() => active.data ?? [], [active.data]);
  const isSprint = tab === 'sprint';

  const fastest = useMemo(
    () => rows.find((r) => r.fastestLap?.rank === '1'),
    [rows],
  );

  const podium = rows.filter((r) => Number(r.position) <= 3);
  const winner = rows[0];

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <PageHeader
        eyebrow="Classification"
        title="Race Results"
        description="Official finishing order with grid position, positions gained, points and race status."
        actions={
          <>
            <div className="w-full min-w-56 sm:w-72">
              <RaceSelect races={completed} value={round} onChange={setRound} />
            </div>
            <RefreshHint
              at={active.lastFetchedAt}
              onRefresh={active.refresh}
              busy={active.refreshing}
            />
          </>
        }
      >
        {race && (
          <div className="mt-6">
            <Tabs
              items={[
                { value: 'race', label: 'Grand Prix' },
                { value: 'sprint', label: 'Sprint' },
              ]}
              value={tab}
              onChange={setTab}
              accent={(v) =>
                v === 'sprint' ? 'var(--color-purple-fp)' : 'var(--color-f1-red)'
              }
              aria-label="Session type"
            />
          </div>
        )}
      </PageHeader>

      {/* ---- Event summary ---- */}
      {race && (
        <Panel className="notched relative mb-4 overflow-hidden">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <TrackImage circuit={race.locality} round={race.round} className="size-16 sm:size-20" />
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-2 flex items-center gap-2">
                <span className="accent-bar inline-block h-3 w-1.5" />
                {isSprint ? 'Sprint' : 'Grand Prix'} · Round {Number(race.round)}
              </p>
              <h2 className="font-display text-xl leading-tight font-extrabold tracking-[-0.03em] text-mist-50 sm:text-2xl">
                {race.raceName}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-2.5 text-[12px] text-mist-400">
                <Flag country={race.country} />
                {race.circuitName}
                <span className="text-mist-600">·</span>
                <span className="font-mono">
                  {getRaceStart(race)?.toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>
        </Panel>
      )}

      {/* ---- Podium ---- */}
      {rows.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {podium.map((row, i) => {
            const color = getTeamColor(row.constructorName);
            const delta = positionDelta(row.grid, row.position);
            return (
              <Panel key={row.driverId} className={cn('relative overflow-hidden', i === 0 && 'sm:order-first')}>
                {i === 0 && <span aria-hidden className="accent-bar absolute inset-y-0 left-0 w-1" />}
                <div className="flex items-center gap-3.5">
                  <PositionCell position={row.positionText} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-mist-50">
                      {surname(row.driverName)}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-mist-500">
                      <TeamDot color={color} />
                      <span className="truncate">{row.constructorName}</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="num text-lg leading-none font-bold text-mist-50">
                      {formatNumber(row.points)}
                    </p>
                    <p className="num mt-1 font-mono text-[9.5px] text-mist-500">PTS</p>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                  <span className="font-mono text-[10px] text-mist-500">
                    Grid {row.grid}
                  </span>
                  <DeltaBadge delta={delta} />
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* ---- Full classification ---- */}
      <Panel flush>
        <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-1.5">Full classification</p>
              {winner && (
                <p className="text-[13px] text-mist-300">
                  Winner:{' '}
                  <span className="font-semibold text-mist-50">
                    {winner.driverName}
                  </span>{' '}
                  <span className="text-mist-500">({winner.constructorName})</span>
                </p>
              )}
            </div>
            {fastest?.fastestLap && (
              <span className="inline-flex items-center gap-1.5 rounded-xs border border-purple-fp/35 bg-purple-fp/10 px-2 py-1 font-mono text-[9.5px] tracking-[0.1em] text-purple-fp uppercase">
                <Zap size={10} />
                Fastest lap {fastest.fastestLap.time} · {surname(fastest.driverName)}
              </span>
            )}
          </div>
        </div>

        {active.error ? (
          <ErrorState message={active.error.message} onRetry={active.refresh} />
        ) : loadingRaces || active.loading ? (
          <div className="p-5 sm:p-6">
            <SkeletonRows rows={10} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={isSprint ? <Zap size={18} /> : undefined}
            title={
              isSprint
                ? 'No Sprint at this round'
                : 'No classification yet'
            }
            description={
              isSprint
                ? 'Not every Grand Prix weekend has a Sprint. Switch to the Grand Prix tab for the main race.'
                : 'Results appear once the session has finished and the timing data is published.'
            }
            action={
              isSprint && (
                <Button variant="secondary" size="sm" onClick={() => setTab('race')}>
                  View Grand Prix result
                </Button>
              )
            }
          />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th className="w-14">Pos</Th>
                <Th>Driver</Th>
                <Th align="center" className="hidden sm:table-cell">
                  Grid
                </Th>
                <Th align="center" className="hidden sm:table-cell">
                  Δ
                </Th>
                <Th align="right">Pts</Th>
                <Th className="hidden md:table-cell">Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Tr key={`${row.driverId}-${row.position}`}>
                  <Td>
                    <PositionCell position={row.positionText} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <TeamDot color={getTeamColor(row.constructorName)} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-mist-50">
                          {row.driverName}
                        </p>
                        <p className="num mt-0.5 font-mono text-[10px] text-mist-500">
                          #{row.driverNumber} · {row.constructorName}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td align="center" className="hidden sm:table-cell">
                    <span className="num text-[12.5px] text-mist-400">{row.grid}</span>
                  </Td>
                  <Td align="center" className="hidden sm:table-cell">
                    <DeltaBadge delta={positionDelta(row.grid, row.position)} compact />
                  </Td>
                  <Td align="right">
                    <span
                      className={cn(
                        'num text-[13.5px] font-semibold',
                        Number(row.points) > 0 ? 'text-mist-50' : 'text-mist-600',
                      )}
                    >
                      {formatNumber(row.points)}
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <StatusPill status={row.status} time={row.time} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Panel>
    </PageContainer>
  );
}

function DeltaBadge({ delta, compact }: { delta: number; compact?: boolean }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-mist-600">
        <Minus size={10} />
        {!compact && <span>No change</span>}
      </span>
    );
  }
  const gained = delta > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono font-semibold',
        compact ? 'text-[11.5px]' : 'text-[12px]',
        gained ? 'text-turf' : 'text-f1-red-bright',
      )}
      title={gained ? 'Positions gained' : 'Positions lost'}
    >
      {gained ? <TrendingUp size={compact ? 11 : 12} /> : <TrendingDown size={compact ? 11 : 12} />}
      {gained ? '+' : ''}
      {delta}
    </span>
  );
}
