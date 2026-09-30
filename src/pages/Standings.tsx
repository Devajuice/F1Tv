import { useMemo, useState } from 'react';
import { Trophy, Users } from 'lucide-react';
import {
  getConstructorStandings,
  getDriverStandings,
  getSchedule,
  type ConstructorStanding,
  type DriverStanding,
} from '../api/f1Api';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { allTeams, getTeam, getTeamColor } from '../data/teams';
import { Select, type SelectOption } from '../components/ui/Select';
import { countryFlag, formatDate, formatNumber, pluralizePoints, surname } from '../lib/format';
import { getCompletedRaces } from '../lib/races';
import { PageContainer, PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Tabs } from '../components/ui/Tabs';
import { DataTable, PositionCell, Td, Th, Tr } from '../components/ui/Table';
import { TeamDot } from '../components/ui/Badge';
import { DriverAvatar } from '../components/ui/Atoms';
import { EmptyState, ErrorState, RefreshHint } from '../components/ui/States';
import { SkeletonRows } from '../components/ui/Skeleton';

const POLL = 180_000;

type Tab = 'drivers' | 'teams';

export default function Standings() {
  useDocumentTitle('Standings');
  const [tab, setTab] = useState<Tab>('drivers');
  const [round, setRound] = useState<string>(''); // '' = latest round

  const drivers = useAsync<DriverStanding[]>(
    () => getDriverStandings(undefined, round || undefined),
    [round],
    { intervalMs: POLL },
  );
  const constructors = useAsync<ConstructorStanding[]>(
    () => getConstructorStandings(undefined, round || undefined),
    [round],
    { intervalMs: POLL },
  );

  const active = tab === 'drivers' ? drivers : constructors;
  const rows = useMemo(() => active.data ?? [], [active.data]);

  const leader = rows[0];
  const topThree = useMemo(
    () => (leader ? rows.filter((r) => Number(r.position) <= 3) : []),
    [rows, leader],
  );

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <PageHeader
        eyebrow={`${new Date().getFullYear()} Championship`}
        title="Standings"
        description="Championship classification after the latest completed round, with points gaps to the leader."
        actions={
          <>
            <div className="w-40">
              <RoundPicker value={round} onChange={setRound} />
            </div>
            <RefreshHint
              at={active.lastFetchedAt ?? Date.now()}
              onRefresh={active.refresh}
              busy={active.refreshing}
            />
          </>
        }
      >
        <div className="mt-6">
          <Tabs
            items={[
              { value: 'drivers', label: 'Drivers', hint: `${drivers.data?.length ?? ''}` },
              { value: 'teams', label: 'Constructors', hint: `${constructors.data?.length ?? ''}` },
            ]}
            value={tab}
            onChange={setTab}
            aria-label="Standings category"
          />
        </div>
      </PageHeader>

      {/* ---- Leader feature ---- */}
      {active.loading ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-28 rounded-lg" />
          ))}
        </div>
      ) : topThree.length > 0 ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {topThree.map((row, i) => {
            const isDriver = tab === 'drivers';
            const name = isDriver
              ? (row as DriverStanding).driverName
              : (row as ConstructorStanding).constructorName;
            const color = isDriver
              ? getTeamColor((row as DriverStanding).teamName)
              : getTeamColor((row as ConstructorStanding).constructorName);
            const points = Number(row.points);
            const leadPoints = Number(leader?.points ?? 0);

            return (
              <Panel
                key={row.position}
                className={`relative overflow-hidden ${i === 0 ? 'sm:order-first' : ''}`}
              >
                {i === 0 && (
                  <span
                    aria-hidden
                    className="accent-bar absolute top-0 left-0 h-full w-1"
                  />
                )}
                <div className="flex items-center gap-3.5">
                  {isDriver ? (
                    <DriverAvatar
                      number={(row as DriverStanding).driverNumber}
                      name={name}
                      color={color}
                      size="lg"
                    />
                  ) : (
                    <div
                      className="flex size-16 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}22`, border: `1.5px solid ${color}` }}
                    >
                      <TeamDot color={color} className="size-5 ring-0" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow mb-1.5">
                      {i === 0 ? 'Championship leader' : `P${row.position}`}
                    </p>
                    <p className="truncate text-[15px] font-semibold text-mist-50">
                      {isDriver ? surname(name) : name}
                    </p>
                    <p className="num mt-2 text-2xl leading-none font-bold text-mist-50">
                      {formatNumber(row.points)}
                      <span className="ml-1.5 text-[11px] font-medium text-mist-500">
                        pts
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                  <span className="font-mono text-[10px] text-mist-500">
                    {row.wins} {Number(row.wins) === 1 ? 'win' : 'wins'}
                  </span>
                  <span className="num text-[11px] text-mist-400">
                    {i === 0
                      ? '—'
                      : `−${leadPoints - points} to leader`}
                  </span>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : null}

      {/* ---- Full table ---- */}
      <Panel flush>
        <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
          {active.error ? (
            <ErrorState
              message={active.error.message}
              onRetry={active.refresh}
              className="py-6"
            />
          ) : active.loading ? (
            <div className="px-1 py-2">
              <SkeletonRows rows={8} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={tab === 'drivers' ? <Users size={18} /> : <Trophy size={18} />}
              title="No standings available"
              description={
                round
                  ? 'There were no classified drivers at this round.'
                  : 'The season has not started yet — check back after the first race.'
              }
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th className="w-14">Pos</Th>
                  <Th>{tab === 'drivers' ? 'Driver' : 'Constructor'}</Th>
                  {tab === 'drivers' && <Th className="hidden sm:table-cell">Team</Th>}
                  <Th align="right" className="hidden sm:table-cell">
                    Wins
                  </Th>
                  <Th align="right">Pts</Th>
                  <Th align="right" className="hidden md:table-cell">
                    Gap
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <Tr
                    key={
                      tab === 'drivers'
                        ? (row as DriverStanding).driverId
                        : (row as ConstructorStanding).constructorId
                    }
                  >
                    <RowCells
                      row={row}
                      tab={tab}
                      leaderPoints={Number(leader?.points ?? 0)}
                      index={i}
                    />
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </div>
      </Panel>

      <TeamLegend />
    </PageContainer>
  );
}

function RowCells({
  row,
  tab,
  leaderPoints,
  index,
}: {
  row: DriverStanding | ConstructorStanding;
  tab: Tab;
  leaderPoints: number;
  index: number;
}) {
  const isDriver = tab === 'drivers';
  const d = row as DriverStanding;
  const c = row as ConstructorStanding;
  const name = isDriver ? d.driverName : c.constructorName;
  const color = isDriver ? getTeamColor(d.teamName) : getTeamColor(c.constructorName);
  const points = Number(row.points);
  const gap = index === 0 ? null : leaderPoints - points;

  return (
    <>
      <Td>
        <PositionCell position={row.positionText} />
      </Td>
      <Td>
        <div className="flex items-center gap-3">
          {isDriver ? (
            <DriverAvatar number={d.driverNumber} name={name} color={color} size="sm" />
          ) : (
            <TeamDot color={color} />
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-mist-50">
              {isDriver ? surname(name) : name}
            </p>
            {isDriver && (
              <p className="num mt-0.5 font-mono text-[10px] text-mist-500">
                #{d.driverNumber}
              </p>
            )}
          </div>
        </div>
      </Td>
      {isDriver && (
        <Td className="hidden sm:table-cell">
          <span className="flex items-center gap-2 text-[12px] text-mist-400">
            <TeamDot color={color} />
            <span className="truncate">{d.teamName}</span>
          </span>
        </Td>
      )}
      <Td align="right" className="hidden sm:table-cell">
        <span className="num text-[12.5px] text-mist-300">{row.wins}</span>
      </Td>
      <Td align="right">
        <span className="num text-[14px] font-bold text-mist-50">
          {formatNumber(row.points)}
        </span>
        {points > 0 && (
          <span className="ml-1 hidden font-mono text-[9.5px] text-mist-600 lg:inline">
            {pluralizePoints(row.points)}
          </span>
        )}
      </Td>
      <Td align="right" className="hidden md:table-cell">
        <span className="num text-[12px] text-mist-400">
          {gap === null ? 'Leader' : `−${gap}`}
        </span>
      </Td>
    </>
  );
}

function RoundPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { data: races } = useAsync(() => getSchedule(), []);

  const options = useMemo<SelectOption[]>(() => {
    const now = Date.now();
    return getCompletedRaces(races ?? [], now)
      .reverse()
      .map((race) => ({
        value: race.round,
        label: `R${Number(race.round)} · ${race.raceName}`,
        meta: formatDate(race.date),
        lead: (
          <span className="shrink-0 text-[13px] leading-none">
            {countryFlag(race.country)}
          </span>
        ),
      }));
  }, [races]);

  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      label="Championship round"
      emptyText="No completed rounds"
    />
  );
}

function TeamLegend() {
  const teams = allTeams.filter((t) => !['rb', 'sauber'].includes(t.id));
  return (
    <Panel className="mt-4">
      <p className="eyebrow mb-3.5">Team colours</p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2.5">
        {teams.map((team) => {
          const resolved = getTeam(team.id);
          return (
            <li
              key={team.id}
              className="inline-flex items-center gap-2 text-[11.5px] text-mist-400"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-[2px] skew-x-[-18deg]"
                style={{ backgroundColor: resolved.color }}
              />
              {resolved.name}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
