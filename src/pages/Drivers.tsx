import { useMemo, useState } from 'react';
import { Cake, Flag, Hash, Search, Trophy, X } from 'lucide-react';
import { getDriverList, type DriverProfile } from '../api/f1Api';
import { getTeamColor, getTeamName } from '../data/teams';
import { getAge, initials, surname } from '../lib/format';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageContainer, PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { DriverAvatar, Flag as CountryFlag } from '../components/ui/Atoms';
import { EmptyState, ErrorState, RefreshHint } from '../components/ui/States';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

type SortKey = 'number' | 'name' | 'age';

export default function Drivers() {
  useDocumentTitle('Drivers');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('number');

  const {
    data: drivers,
    loading,
    error,
    refresh,
    refreshing,
    lastFetchedAt,
  } = useAsync<DriverProfile[]>(() => getDriverList(), []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? (drivers ?? []).filter(
          (d) =>
            d.lastName.toLowerCase().includes(needle) ||
            d.firstName.toLowerCase().includes(needle) ||
            d.teamName.toLowerCase().includes(needle) ||
            d.nationality.toLowerCase().includes(needle) ||
            d.driverNumber.includes(needle),
        )
      : (drivers ?? []);

    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.lastName.localeCompare(b.lastName);
      if (sort === 'age') {
        return a.dateOfBirth.localeCompare(b.dateOfBirth);
      }
      return (
        (Number(a.driverNumber) || 99) - (Number(b.driverNumber) || 99)
      );
    });
  }, [drivers, query, sort]);

  const hasQuery = query.trim().length > 0;

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <PageHeader
        eyebrow={`${drivers?.length ?? 0} on the grid`}
        title="Drivers"
        description="The current entry list, with number, team and age. Search by name, team, nationality or car number."
        actions={
          <RefreshHint
            at={lastFetchedAt}
            onRefresh={refresh}
            busy={refreshing}
          />
        }
      >
        {/* ---- Toolbar ---- */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={14}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-mist-500"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drivers, teams or nationalities"
              aria-label="Search drivers"
              className="h-10 w-full rounded-xs border border-line/10 bg-veil/[0.03] pr-10 pl-9 text-[12.5px] text-mist-100 placeholder:text-mist-600 focus:border-f1-red/50 focus:ring-1 focus:ring-f1-red/30 focus:outline-none"
            />
            {hasQuery && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-mist-500 transition-colors hover:text-mist-200"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div
            className="flex shrink-0 items-center gap-1 rounded-xs border border-line/10 bg-veil/[0.03] p-1"
            role="group"
            aria-label="Sort drivers"
          >
            {(
              [
                { key: 'number', label: 'Number', icon: Hash },
                { key: 'name', label: 'Name', icon: Flag },
                { key: 'age', label: 'Age', icon: Cake },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                aria-pressed={sort === key}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-xs px-2.5 font-mono text-[10px] tracking-[0.08em] uppercase transition-colors',
                  sort === key
                    ? 'bg-veil/10 text-mist-50'
                    : 'text-mist-500 hover:text-mist-200',
                )}
              >
                <Icon size={10} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      {/* ---- Grid ---- */}
      {error ? (
        <Panel className="mt-4">
          <ErrorState message={error.message} onRetry={refresh} />
        </Panel>
      ) : loading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Panel key={i} className="h-[104px]">
              <Skeleton className="h-full w-full" />
            </Panel>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Panel className="mt-4">
          <EmptyState
            icon={<Search size={18} />}
            title="No drivers match"
            description={`Nothing in the entry list matches “${query.trim()}”.`}
            action={
              <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                Clear search
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((driver) => (
              <li key={driver.driverId}>
                <DriverCard driver={driver} />
              </li>
            ))}
          </ul>
          {hasQuery && (
            <p className="mt-4 text-center font-mono text-[10.5px] text-mist-600">
              {visible.length} of {drivers?.length ?? 0} drivers shown
            </p>
          )}
        </>
      )}
    </PageContainer>
  );
}

function DriverCard({ driver }: { driver: DriverProfile }) {
  const color = getTeamColor(driver.teamId);
  const team = getTeamName(driver.teamId);
  const age = getAge(driver.dateOfBirth);
  const fullName = `${driver.firstName} ${surname(driver.lastName)}`;

  return (
    <Panel
      interactive
      className="group relative h-full overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
    >
      {/* Livery stripe */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: color }}
      />
      {/* Team wash — .team-sheen derives its gradient from currentColor. */}
      <span
        aria-hidden
        className="team-sheen pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.09]"
        style={{ color }}
      />

      <div className="relative flex items-center gap-4">
        <DriverAvatar
          name={fullName}
          number={driver.driverNumber}
          color={color}
          size="lg"
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] leading-tight font-extrabold tracking-[-0.02em] text-mist-50">
            {fullName}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-mist-400">
            <CountryFlag country={driver.nationality} />
            {driver.nationality || 'Unknown'}
          </p>
          <p
            className="mt-2 flex items-center gap-1.5 truncate text-[11px] font-semibold"
            style={{ color }}
          >
            <Trophy size={10} className="shrink-0" />
            {team}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="num font-display text-2xl leading-none font-black text-mist-50">
            {driver.driverNumber}
          </p>
          <p className="num mt-1.5 font-mono text-[9.5px] text-mist-500">
            {age ? `${age} yrs` : '—'}
          </p>
        </div>
      </div>

      <span className="num pointer-events-none absolute -top-3 -right-1 font-display text-[54px] leading-none font-black text-line/[0.05] select-none">
        {initials(fullName)}
      </span>
    </Panel>
  );
}
