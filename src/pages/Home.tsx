import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Flag as FlagIcon, Gauge, TvMinimalPlay, Users } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { getSessionMeta } from '../data/sessions';
import { getTeamColor } from '../data/teams';
import {
  getConstructorStandings,
  getDriverStandings,
  getSchedule,
  type ConstructorStanding,
  type DriverStanding,
} from '../api/f1Api';
import {
  getLatestWeather,
  getWeatherForSession,
  isTrackWet,
  type F1Weather,
} from '../api/openf1';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  formatNumber,
  formatShortDate,
  formatTimeZoned,
  relativeDayLabel,
  surname,
} from '../lib/format';
import { getRaceStart } from '../lib/races';
import { ButtonLink } from '../components/ui/Button';
import { Panel, PanelTitle } from '../components/ui/Panel';
import { LiveDot, TeamDot } from '../components/ui/Badge';
import { Countdown, CountdownStat } from '../components/ui/Countdown';
import { DriverAvatar, Flag, Meter, Stat } from '../components/ui/Atoms';
import { TrackMap } from '../components/ui/TrackMap';
import { Skeleton, SkeletonRows } from '../components/ui/Skeleton';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/States';
import { PageContainer } from '../components/ui/PageHeader';

const STANDINGS_POLL = 180_000;
const WEATHER_POLL = 180_000;

export default function Home() {
  useDocumentTitle('Live F1');
  const { current, live, upcoming, loading: sessionsLoading } = useSession();

  /* --- Weather: prefer the live session's circuit, else the latest feed --- */
  const weatherSessionKey = live?.session_key ?? current?.session_key ?? null;

  const { data: weather } = useAsync<F1Weather | null>(
    async () => {
      if (weatherSessionKey) {
        const forSession = await getWeatherForSession(weatherSessionKey);
        if (forSession) return forSession;
      }
      return getLatestWeather();
    },
    [weatherSessionKey],
    { intervalMs: WEATHER_POLL },
  );

  /* --- Championship snapshot --- */
  const { data: drivers } = useAsync<DriverStanding[]>(() => getDriverStandings(), [], {
    intervalMs: STANDINGS_POLL,
  });
  const { data: constructors } = useAsync<ConstructorStanding[]>(
    () => getConstructorStandings(),
    [],
    { intervalMs: STANDINGS_POLL },
  );

  /* --- Upcoming rounds --- */
  const { data: races } = useAsync(() => getSchedule(), []);

  const nextRaces = useMemo(() => (races ?? []).filter((r) => {
    const start = getRaceStart(r);
    return !start || start.getTime() > Date.now() - 2 * 3600_000;
  }).slice(0, 3), [races]);

  const snapshot = weather ?? null;
  const hasWeather = Boolean(
    snapshot &&
      (snapshot.air_temperature !== null || snapshot.track_temperature !== null),
  );
  const trackState = isTrackWet(snapshot);

  return (
    <PageContainer className="pt-4 sm:pt-6 lg:pt-8">
      <Hero
        live={live}
        current={current}
        weather={hasWeather ? snapshot : null}
        trackState={trackState}
        loading={sessionsLoading}
      />

      <QuickAccess />

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Championship drivers={drivers} constructors={constructors} />
        <SessionQueue current={current} live={live} upcoming={upcoming} loading={sessionsLoading} />
      </div>

      <section className="mt-4">
        <Panel flush className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line/[0.06] px-5 py-4 sm:px-6">
            <PanelTitle eyebrow="Season" title="Upcoming race weekends" />
            <Link
              to="/calendar"
              className="link-wipe shrink-0 text-[11px] font-semibold tracking-[0.06em] text-mist-400 uppercase hover:text-mist-100"
            >
              Full calendar
            </Link>
          </div>

          {nextRaces.length === 0 ? (
            <EmptyState
              title="Season complete"
              description="No more rounds on the calendar for this season."
            />
          ) : (
            <div className="grid divide-y divide-line/[0.05] md:grid-cols-3 md:divide-x md:divide-y-0">
              {nextRaces.map((race, index) => (
                <RaceCard key={race.round} race={race} first={index === 0} />
              ))}
            </div>
          )}
        </Panel>
      </section>
    </PageContainer>
  );
}

/* ========================================================================== */
/* Hero                                                                       */
/* ========================================================================== */

function Hero({
  live,
  current,
  weather,
  trackState,
  loading,
}: {
  live: ReturnType<typeof useSession>['live'];
  current: ReturnType<typeof useSession>['current'];
  weather: F1Weather | null;
  trackState: boolean | null;
  loading: boolean;
}) {
  const meta = current ? getSessionMeta(current.session_name, current.session_type) : null;
  const isLive = Boolean(live);
  const target = current?.date_start ?? null;
  const circuitName = current?.location || current?.circuit_short_name;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border bg-ink-850/90 shadow-[var(--shadow-lift)] ${
        isLive ? 'border-live/35' : 'border-line/12'
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_320px_at_10%_-10%,var(--glow-red),transparent_60%),radial-gradient(700px_300px_at_100%_0%,var(--glow-cool),transparent_55%)]"
      />
      <div className="relative p-5 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-line/12 bg-ink-900/40 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-mist-300 uppercase">
                {new Date().getFullYear()} Season hub
              </span>
              {isLive && meta && (
                <span className="inline-flex items-center gap-2 rounded-full border border-live/30 bg-live/12 px-3 py-1 text-live">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-live" />
                  </span>
                  <span className="font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">{meta.label} live</span>
                </span>
              )}
            </div>

            <h1 className="max-w-4xl font-display text-[clamp(2.2rem,7vw,5rem)] leading-[0.88] font-black tracking-[-0.055em] text-mist-50">
              {isLive ? (
                <>
                  Race weekend,
                  <br />
                  right now.
                </>
              ) : (
                <>
                  Follow every
                  <br />
                  Formula 1 session.
                </>
              )}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] text-mist-300">
              {loading && !current ? (
                <Skeleton className="h-4 w-72" />
              ) : current ? (
                <>
                  <span className="inline-flex items-center gap-2 font-semibold text-mist-50">
                    {current.country_name && <Flag country={current.country_name} />}
                    {circuitName}
                  </span>
                  <span className="text-mist-600">•</span>
                  <span className="text-mist-400">
                    {meta?.label ?? current.session_name} · {formatShortDate(current.date_start)} · {formatTimeZoned(current.date_start)}
                  </span>
                </>
              ) : (
                <span className="text-mist-400">Live streams, schedules, results, standings and highlights in one place.</span>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <ButtonLink to="/stream" variant={isLive ? 'live' : 'primary'} size="lg">
                <TvMinimalPlay className="size-4" />
                {isLive ? 'Open live stream' : 'Watch streams'}
              </ButtonLink>
              <ButtonLink to="/calendar" variant="secondary" size="lg">
                <CalendarClock className="size-4" />
                Race calendar
              </ButtonLink>
              <ButtonLink to="/highlights" variant="ghost" size="lg">
                <TvMinimalPlay className="size-4" />
                Highlights
              </ButtonLink>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <HeroStat label="Championship" value="Standings & points" to="/standings" />
              <HeroStat label="Results" value="Race, quali & grid" to="/results" />
              <HeroStat label="News" value="Latest paddock stories" to="/news" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-line/10 bg-ink-900/45 p-4 backdrop-blur-sm sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">{isLive ? 'On air' : 'Next session'}</p>
                  <p className="text-lg font-semibold tracking-tight text-mist-50">
                    {current ? meta?.label ?? current.session_name : 'Awaiting schedule'}
                  </p>
                  <p className="mt-1 text-[12px] text-mist-400">{circuitName ?? 'Formula 1'}</p>
                </div>
                {circuitName && <TrackMap circuit={circuitName} round={current?.session_key} className="size-16 opacity-90 sm:size-20" />}
              </div>

              {isLive && live ? (
                <div className="rounded-lg border border-live/25 bg-live/10 px-4 py-4">
                  <LiveDot label="Session in progress" />
                  <p className="num mt-3 text-3xl font-bold text-mist-50">{formatTimeZoned(live.date_start)}</p>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-mist-400 uppercase">Started {formatShortDate(live.date_start)}</p>
                </div>
              ) : current ? (
                <div className="rounded-lg border border-line/10 bg-veil/[0.03] px-4 py-4">
                  <p className="font-mono text-[10px] tracking-[0.14em] text-mist-500 uppercase">Countdown</p>
                  <div className="mt-3">
                    <Countdown target={target} />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-line/10 bg-veil/[0.03] px-4 py-4 text-sm text-mist-400">
                  Session timing will appear here when the next event is published.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-line/10 bg-ink-900/35 p-4 backdrop-blur-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="eyebrow">Track conditions</p>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[9.5px] font-semibold tracking-[0.12em] uppercase ${
                    trackState === true
                      ? 'border-telemetry/40 bg-telemetry/12 text-telemetry'
                      : trackState === false
                        ? 'border-sodium/40 bg-sodium/12 text-sodium'
                        : 'border-line/12 bg-veil/5 text-mist-400'
                  }`}
                >
                  {trackState === true ? 'Wet track' : trackState === false ? 'Dry track' : 'Awaiting data'}
                </span>
              </div>

              {!weather ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <WeatherStat label="Air" value={weather.air_temperature} unit="°C" />
                  <WeatherStat label="Track" value={weather.track_temperature} unit="°C" />
                  <WeatherStat label="Humidity" value={weather.humidity} unit="%" />
                  <WeatherStat label="Wind" value={weather.wind_speed} unit="km/h" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-line/10 bg-ink-900/30 px-4 py-3 transition-all hover:-translate-y-px hover:border-line/20 hover:bg-ink-900/45"
    >
      <p className="font-mono text-[9.5px] tracking-[0.14em] text-mist-500 uppercase">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-mist-100 group-hover:text-mist-50">{value}</p>
    </Link>
  );
}

function QuickAccess() {
  const items = [
    { to: '/schedule', label: 'Weekend Sessions', description: 'Practice, qualifying, sprint and race times', icon: CalendarClock },
    { to: '/results', label: 'Race Results', description: 'Grand Prix and Sprint classifications', icon: FlagIcon },
    { to: '/qualifying', label: 'Qualifying', description: 'Q1, Q2 and Q3 breakdowns', icon: Gauge },
    { to: '/drivers', label: 'Drivers', description: 'The current grid and team line-ups', icon: Users },
  ];
  return (
    <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.to} to={item.to} className="panel panel-interactive group block p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-lg border border-line/12 bg-ink-900/40 text-mist-200">
                <Icon className="size-4.5" />
              </span>
              <ArrowRight className="size-4 text-mist-500 transition-transform group-hover:translate-x-0.5 group-hover:text-mist-300" />
            </div>
            <p className="eyebrow mb-2">Explore</p>
            <p className="text-[15px] font-semibold tracking-tight text-mist-50">{item.label}</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist-400">{item.description}</p>
          </Link>
        );
      })}
    </section>
  );
}

function WeatherStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-line/10 bg-veil/[0.03] px-3 py-3">
      <span className="block font-mono text-[9.5px] tracking-[0.12em] text-mist-500 uppercase">
        {label}
      </span>
      <span className="num mt-1.5 block text-[18px] font-bold text-mist-50">
        {value === null ? '—' : Math.round(value)}
        {value !== null && <span className="ml-0.5 text-[11px] font-medium text-mist-500">{unit}</span>}
      </span>
    </div>
  );
}

/* ========================================================================== */
/* Championship snapshot                                                      */
/* ========================================================================== */

type StandingsTab = 'drivers' | 'teams';

function Championship({
  drivers,
  constructors,
}: {
  drivers: DriverStanding[] | undefined;
  constructors: ConstructorStanding[] | undefined;
}) {
  const [tab, setTab] = useState<StandingsTab>('drivers');

  return (
    <Panel flush>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/[0.06] px-5 py-4 sm:px-6">
        <PanelTitle eyebrow="Championship" title="Standings" />
        <Tabs
          items={[
            { value: 'drivers', label: 'Drivers' },
            { value: 'teams', label: 'Teams' },
          ]}
          value={tab}
          onChange={setTab}
          size="sm"
          aria-label="Standings category"
        />
      </div>

      <div className="p-5 sm:p-6">
        {tab === 'drivers' ? (
          drivers === undefined ? (
            <SkeletonRows rows={5} />
          ) : drivers.length === 0 ? (
            <EmptyState title="No standings yet" description="The season has not started." />
          ) : (
            <DriverStandingsList rows={drivers.slice(0, 6)} />
          )
        ) : constructors === undefined ? (
          <SkeletonRows rows={5} />
        ) : constructors.length === 0 ? (
          <EmptyState title="No standings yet" />
        ) : (
          <TeamStandingsList rows={constructors.slice(0, 6)} />
        )}
      </div>
    </Panel>
  );
}

/** Local tab state, kept out of the shared Tabs component's contract. */
function DriverStandingsList({ rows }: { rows: DriverStanding[] }) {
  const leaderPoints = Number(rows[0]?.points ?? 0);
  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row, i) => {
        const color = getTeamColor(row.teamName);
        const points = Number(row.points);
        return (
          <li key={row.driverId}>
            <Link
              to="/standings"
              className="group flex items-center gap-3 rounded-sm px-2 py-2 transition-colors hover:bg-veil/[0.04]"
            >
              <span
                className={`num w-6 shrink-0 text-[13px] font-bold ${
                  i === 0 ? 'text-sodium' : i === 1 ? 'text-mist-200' : i === 2 ? 'text-[#c2793a]' : 'text-mist-500'
                }`}
              >
                {row.positionText}
              </span>
              <DriverAvatar number={row.driverNumber} name={row.driverName} color={color} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="truncate text-[13px] font-semibold text-mist-50 group-hover:text-mist-100">
                    {surname(row.driverName)}
                  </span>
                  <TeamDot color={color} />
                </span>
                <span className="mt-0.5 block truncate font-mono text-[10px] text-mist-500">
                  {i === 0 ? 'Leader' : `−${leaderPoints - points} pts`}
                </span>
              </span>
              <span className="num shrink-0 text-[15px] font-bold text-mist-50">
                {formatNumber(row.points)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function TeamStandingsList({ rows }: { rows: ConstructorStanding[] }) {
  const leaderPoints = Number(rows[0]?.points ?? 0);
  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row, i) => {
        const color = getTeamColor(row.constructorName);
        const points = Number(row.points);
        return (
          <li key={row.constructorId} className="px-2 py-2">
            <div className="flex items-center gap-3">
              <span
                className={`num w-6 shrink-0 text-[13px] font-bold ${
                  i === 0 ? 'text-sodium' : i === 1 ? 'text-mist-200' : i === 2 ? 'text-[#c2793a]' : 'text-mist-500'
                }`}
              >
                {row.positionText}
              </span>
              <TeamDot color={color} className="size-2.5" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-mist-50">
                {row.constructorName}
              </span>
              <span className="num shrink-0 text-[15px] font-bold text-mist-50">
                {formatNumber(row.points)}
              </span>
            </div>
            <div className="mt-2 pl-[42px]">
              <Meter value={leaderPoints ? points / leaderPoints : 0} color={color} delay={i * 60} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ========================================================================== */
/* Session queue                                                              */
/* ========================================================================== */

function SessionQueue({
  current,
  live,
  upcoming,
  loading,
}: {
  current: ReturnType<typeof useSession>['current'];
  live: ReturnType<typeof useSession>['live'];
  upcoming: ReturnType<typeof useSession>['upcoming'];
  loading: boolean;
}) {
  // One live row plus the next three, deduped by session key.
  const queue = useMemo(() => {
    const seen = new Set<number>();
    const list: Array<{
      key: number;
      name: string;
      type: string;
      start: string;
      circuit: string;
      state: 'live' | 'next' | 'done';
    }> = [];

    const push = (
      s: NonNullable<typeof current>,
      state: 'live' | 'next' | 'done',
    ) => {
      if (seen.has(s.session_key)) return;
      seen.add(s.session_key);
      list.push({
        key: s.session_key,
        name: s.session_name,
        type: s.session_type,
        start: s.date_start,
        circuit: s.location || s.circuit_short_name,
        state,
      });
    };

    if (live) push(live, 'live');
    if (current && (!live || current.session_key !== live.session_key)) push(current, 'next');
    upcoming.slice(0, live ? 3 : 2).forEach((s) => push(s, 'next'));

    return list;
  }, [current, live, upcoming]);

  return (
    <Panel flush>
      <div className="border-b border-line/[0.06] px-5 py-4 sm:px-6">
        <PanelTitle eyebrow="Circuit activity" title="What's on" />
      </div>

      <div className="p-3 sm:p-4">
        {loading && queue.length === 0 ? (
          <SkeletonRows rows={4} gap="gap-2" />
        ) : queue.length === 0 ? (
          <EmptyState
            title="No sessions scheduled"
            description="The OpenF1 feed is not reporting any sessions for this season."
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {queue.map((item) => {
              const meta = getSessionMeta(item.name, item.type);
              return (
                <li
                  key={item.key}
                  className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 transition-colors ${
                    item.state === 'live'
                      ? 'border-live/30 bg-live/8'
                      : 'border-transparent hover:border-line/8 hover:bg-veil/[0.03]'
                  }`}
                >
                  <span
                    className={`num flex size-9 shrink-0 items-center justify-center rounded-xs border font-mono text-[9.5px] font-bold tracking-[0.04em] ${meta.surface} ${meta.color}`}
                  >
                    {meta.badge}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-mist-100">
                      {meta.label}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-mist-500">
                      {formatShortDate(item.start)} · {formatTimeZoned(item.start)}
                    </span>
                  </span>
                  {item.state === 'live' ? (
                    <LiveDot label="" className="shrink-0" />
                  ) : (
                    <span className="shrink-0 font-mono text-[9px] tracking-[0.12em] text-mist-600 uppercase">
                      Next
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="hairline-t mt-3 flex items-center justify-between gap-3 pt-3">
          <span className="font-mono text-[10px] text-mist-500">
            {upcoming.length} upcoming
          </span>
          <Link
            to="/schedule"
            className="link-wipe text-[10.5px] font-semibold tracking-[0.06em] text-mist-400 uppercase hover:text-mist-100"
          >
            All times
          </Link>
        </div>
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* Next race cards                                                            */
/* ========================================================================== */

function RaceCard({
  race,
  first,
}: {
  race: import('../api/f1Api').Race;
  first: boolean;
}) {
  const start = getRaceStart(race);

  return (
    <Link
      to="/calendar"
      className="group relative flex flex-col gap-5 p-5 transition-all hover:bg-veil/[0.03] sm:p-6"
    >
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-line/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:inset-x-6" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2.5 flex items-center gap-1.5">
            <Flag country={race.country} />
            Round {Number(race.round)}
            {first && <span className="rounded-full bg-f1-red/15 px-2 py-0.5 text-f1-red">Next</span>}
          </p>
          <h3 className="truncate text-[17px] font-semibold tracking-tight text-mist-50 group-hover:text-mist-100">
            {race.raceName}
          </h3>
          <p className="mt-1 truncate text-[12px] text-mist-500">{race.circuitName}</p>
          <p className="mt-0.5 truncate text-[11px] text-mist-600">{race.locality}</p>
        </div>
        <div className="shrink-0 rounded-xl border border-line/10 bg-ink-900/35 p-2">
          <TrackMap circuit={race.locality} round={race.round} className="size-14 sm:size-16" />
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/[0.07] pt-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] text-mist-300">
            {formatShortDate(start)} · {formatTimeZoned(start)}
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-mist-500 uppercase">
            {relativeDayLabel(start ?? race.date)}
          </p>
        </div>
        {first ? (
          <CountdownStat target={start} label="to lights out" />
        ) : (
          <Stat
            label="Local start"
            value={
              <span className="text-[15px]">
                {start ? formatTimeZoned(start).split(' ')[0] : 'TBA'}
              </span>
            }
            className="text-right"
          />
        )}
      </div>
    </Link>
  );
}
