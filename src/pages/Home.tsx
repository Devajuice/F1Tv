import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CloudRain,
  Droplets,
  Gauge,
  Play,
  Thermometer,
  Timer,
  Wind,
} from 'lucide-react';
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
    <PageContainer className="pt-6 sm:pt-8">
      <Hero
        live={live}
        current={current}
        weather={hasWeather ? snapshot : null}
        trackState={trackState}
        loading={sessionsLoading}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Championship drivers={drivers} constructors={constructors} />
        <SessionQueue current={current} live={live} upcoming={upcoming} loading={sessionsLoading} />
      </div>

      <section className="mt-4">
        <Panel flush className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line/[0.06] px-5 py-4 sm:px-6">
            <PanelTitle eyebrow="Season" title="Next up" />
            <Link
              to="/calendar"
              className="link-wipe flex shrink-0 items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] text-mist-400 uppercase hover:text-mist-100"
            >
              Full calendar
              <ArrowRight size={12} />
            </Link>
          </div>

          {nextRaces.length === 0 ? (
            <EmptyState
              title="Season complete"
              description="No more rounds on the calendar for this season."
            />
          ) : (
            <div className="grid divide-y divide-line/[0.05] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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

  return (
    <section
      className={`notched relative overflow-hidden rounded-lg border transition-colors duration-500 ${
        isLive
          ? 'border-live/40 bg-linear-to-br from-live/12 via-ink-850 to-ink-850'
          : 'border-line/8 bg-linear-to-br from-f1-red/8 via-ink-850 to-ink-850'
      }`}
    >
      {/* Speed-line texture + corner bloom. */}
      <div aria-hidden className="speedlines pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full opacity-70 blur-3xl"
        style={{
          background: isLive
            ? 'radial-gradient(circle, rgb(255 59 48 / 0.35), transparent 70%)'
            : 'radial-gradient(circle, rgb(225 6 0 / 0.28), transparent 70%)',
        }}
      />

      <div className="relative p-6 sm:p-9 lg:p-11">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <p className="eyebrow mb-4 flex items-center gap-2.5">
              <span className="accent-bar inline-block h-3 w-1.5" />
              {new Date().getFullYear()} Formula 1 World Championship
            </p>

            <h1 className="font-display text-[clamp(2.4rem,8.5vw,4.75rem)] leading-[0.9] font-black tracking-[-0.05em] text-mist-50">
              {isLive ? (
                <>
                  <span className="text-f1-red-bright">ON AIR</span>
                  <br />
                  RIGHT NOW
                </>
              ) : (
                <>
                  WATCH F1
                  <br />
                  <span className="text-f1-red">LIVE</span>
                </>
              )}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-mist-300">
              {loading && !current ? (
                <Skeleton className="h-4 w-64" />
              ) : current ? (
                <>
                  <span className="font-semibold text-mist-50">
                    {current.location || current.circuit_short_name}
                  </span>
                  {current.country_name && (
                    <span className="inline-flex items-center gap-1.5 text-mist-400">
                      <Flag country={current.country_name} />
                      {current.country_name}
                    </span>
                  )}
                  <span className="text-mist-600">/</span>
                  <span className="text-mist-400">
                    {formatShortDate(current.date_start)} ·{' '}
                    {formatTimeZoned(current.date_start)}
                  </span>
                </>
              ) : (
                <span className="text-mist-400">Season schedule published soon</span>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <ButtonLink to="/stream" variant={isLive ? 'live' : 'primary'} size="lg">
                <Play size={13} className="fill-current" />
                {isLive ? 'Watch live now' : 'Watch live'}
              </ButtonLink>
              <ButtonLink to="/highlights" variant="secondary" size="lg">
                Race highlights
              </ButtonLink>
              <ButtonLink to="/standings" variant="ghost" size="lg">
                Standings
              </ButtonLink>
            </div>
          </div>

          {/* Session state block */}
          <div className="flex shrink-0 flex-col items-start gap-4 lg:items-end">
            {isLive && meta ? (
              <div className="rounded-md border border-live/30 bg-live/10 px-5 py-4 lg:text-right">
                <LiveDot label={meta.label} className="lg:justify-end" />
                <p className="num mt-2.5 text-2xl font-bold text-mist-50">
                  {formatTimeZoned(live!.date_start)}
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.1em] text-mist-400 uppercase">
                  Started · in progress
                </p>
              </div>
            ) : current && meta ? (
              <div className="rounded-md border border-line/10 bg-veil/[0.04] px-5 py-4 lg:text-right">
                <p className="eyebrow mb-3 lg:justify-end">{meta.label} starts in</p>
                <Countdown target={target} />
              </div>
            ) : null}
          </div>
        </div>

        {/* Weather strip */}
        <div className="mt-8 border-t border-line/[0.07] pt-5">
          {!weather ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="eyebrow mr-1 inline-flex items-center gap-2">
                <Gauge size={11} className="text-f1-red" />
                Track
              </span>
              <WeatherStat
                icon={<Thermometer size={12} />}
                label="Air"
                value={weather.air_temperature}
                unit="°C"
              />
              <WeatherStat
                icon={<Thermometer size={12} />}
                label="Track"
                value={weather.track_temperature}
                unit="°C"
              />
              <WeatherStat
                icon={<Droplets size={12} />}
                label="Humidity"
                value={weather.humidity}
                unit="%"
              />
              <WeatherStat
                icon={<Wind size={12} />}
                label="Wind"
                value={weather.wind_speed}
                unit="km/h"
              />
              <span
                className={`inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 font-mono text-[9.5px] font-semibold tracking-[0.12em] uppercase ${
                  trackState === true
                    ? 'border-telemetry/40 bg-telemetry/12 text-telemetry'
                    : trackState === false
                      ? 'border-sodium/40 bg-sodium/12 text-sodium'
                      : 'border-line/12 bg-veil/5 text-mist-400'
                }`}
              >
                <CloudRain size={10} />
                {trackState === true ? 'Wet' : trackState === false ? 'Dry' : 'Conditions n/a'}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function WeatherStat({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-mist-500">{icon}</span>
      <span className="font-mono text-[10px] tracking-[0.1em] text-mist-500 uppercase">
        {label}
      </span>
      <span className="num text-[13px] font-semibold text-mist-100">
        {value === null ? '—' : Math.round(value)}
        {value !== null && <span className="ml-0.5 text-[10px] text-mist-500">{unit}</span>}
      </span>
    </span>
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
                  <span className="truncate text-[13px] font-semibold text-mist-50 group-hover:text-f1-red-bright">
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
            icon={<CalendarDays size={18} />}
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
                    <span className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[10px] text-mist-500">
                      <Timer size={9} className="shrink-0" />
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
            className="link-wipe inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.06em] text-mist-400 uppercase hover:text-mist-100"
          >
            All times
            <ArrowRight size={11} />
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
      className="group relative flex flex-col gap-4 p-5 transition-colors hover:bg-veil/[0.03] sm:p-6"
    >
      {first && (
        <span className="absolute top-0 left-0 h-full w-0.5 bg-linear-to-b from-f1-red to-f1-red/0" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow mb-2 flex items-center gap-1.5">
            <Flag country={race.country} />
            Round {Number(race.round)}
            {first && <span className="text-f1-red">· Next</span>}
          </p>
          <h3 className="truncate text-[15px] font-semibold text-mist-50 group-hover:text-f1-red-bright">
            {race.raceName}
          </h3>
          <p className="mt-1 truncate text-[11.5px] text-mist-500">{race.circuitName}</p>
        </div>
        <TrackMap circuit={race.locality} round={race.round} className="size-14" />
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/[0.06] pt-3.5">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] text-mist-300">
            {formatShortDate(start)} · {formatTimeZoned(start)}
          </p>
          <p className="mt-1 font-mono text-[10px] text-mist-500">
            {relativeDayLabel(start ?? race.date)}
          </p>
        </div>
        {first ? (
          <CountdownStat target={start} label="to go" />
        ) : (
          <Stat
            label="Local"
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
