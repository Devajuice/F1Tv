import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPracticeSchedule, getSchedule, type PracticeSession, type Race } from '../api/f1Api';
import { getSessionMeta } from '../data/sessions';
import { useSession } from '../context/SessionContext';
import { useNotifications } from '../context/NotificationsContext';
import { useTimeZone } from '../context/TimeZoneContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  formatDate,
  formatTime,
  formatTimeZoned,
  joinDateTime,
  relativeDayLabel,
} from '../lib/format';
import { getRaceStart, getUpcomingRaces } from '../lib/races';
import { PageContainer, PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { RaceSelect } from '../components/ui/RaceSelect';
import { LiveDot } from '../components/ui/Badge';
import { Flag } from '../components/ui/Atoms'
import { TrackMap } from '../components/ui/TrackMap';
import { EmptyState, ErrorState, RefreshHint } from '../components/ui/States';
import { SkeletonRows } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import {
  InteractiveTimeline,
  type TimelineItem,
} from '../components/ui/Timeline';
import { MatrixClock } from '../components/ui/MatrixClock';
import { cn } from '../lib/cn';

export default function PracticeSchedule() {
  useDocumentTitle('Weekend Schedule');
  const [round, setRound] = useState('');
  const { live } = useSession();
  const notifications = useNotifications();
  const zone = useTimeZone();

  const { data: races, loading: loadingRaces } = useAsync<Race[]>(
    () => getSchedule(),
    [],
  );

  // Upcoming rounds first — this page is about what's still to come, which is
  // what the previous version got backwards.
  const upcoming = useMemo(() => getUpcomingRaces(races ?? []), [races]);

  useEffect(() => {
    const first = upcoming[0];
    if (round || !first) return;
    setRound(first.round);
  }, [upcoming, round]);

  const race = upcoming.find((r) => r.round === round) ?? null;
  const raceStart = race ? getRaceStart(race) : null;

  const {
    data: sessions,
    loading,
    error,
    refresh,
    refreshing,
    lastFetchedAt,
  } = useAsync<PracticeSession[]>(
    async () => {
      if (!race) return [];
      return getPracticeSchedule(race.season, race.round);
    },
    [race?.season, race?.round],
    { enabled: Boolean(race) },
  );

  const rows = sessions ?? [];
  const liveSessionName = live?.session_name;

  const circuitTz = race ? { timeZone: zone.resolve(race.locality) } : undefined;

  const timelineItems: TimelineItem[] = rows.map((session) => {
    const start = joinDateTime(session.date, session.time);
    const meta = getSessionMeta(session.name);
    const isLive = liveSessionName === session.name;
    const isPast = start ? start.getTime() + 90 * 60_000 < Date.now() : false;

    return {
      id: `${session.name}-${session.date}`,
      label: meta.label,
      accessory: (
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              'num flex h-9 w-14 items-center justify-center rounded-xs border font-mono text-[10.5px] font-bold tracking-[0.02em]',
              meta.surface,
              meta.color,
            )}
          >
            {meta.badge}
          </span>
          {isLive && <LiveDot label="" />}
        </span>
      ),
      meta: (
        <>
          {formatDate(start)} · {relativeDayLabel(start)}
        </>
      ),
      time: (
        <>
          <span className="num block text-[16px] leading-none font-bold text-mist-50">
            {formatTimeZoned(start)}
          </span>
          <span className="mt-1 block font-mono text-[9.5px] text-mist-500">
            your time
          </span>
        </>
      ),
      status: isLive ? 'active' : isPast ? 'done' : 'upcoming',
      detail: (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
          <div>
            <dt className="eyebrow mb-1">Your time</dt>
            <dd className="text-mist-200">
              {formatTimeZoned(start)}
              <span className="mt-0.5 block text-[11px] text-mist-500">
                {formatDate(start)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="eyebrow mb-1">At the circuit</dt>
            <dd className="text-mist-200">
              {formatTimeZoned(start, circuitTz)}
              <span className="mt-0.5 block text-[11px] text-mist-500">
                {race?.locality ?? 'Circuit'}
              </span>
            </dd>
          </div>
        </dl>
      ),
    };
  });

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <PageHeader
        eyebrow="Local times"
        title="Weekend Schedule"
        description="Every session of the selected Grand Prix weekend, converted to your local time. Times update automatically as sessions go live."
        actions={
          <>
            <div className="w-full min-w-56 sm:w-72">
              <RaceSelect
                races={upcoming}
                value={round}
                onChange={setRound}
                label="Grand Prix"
              />
            </div>
            <RefreshHint at={lastFetchedAt} onRefresh={refresh} busy={refreshing} />
          </>
        }
      />

      {race && (
        <Panel className="relative mb-4 overflow-hidden">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <TrackMap circuit={race.locality} round={race.round} className="size-16 sm:size-20" />
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-2">
                Round {Number(race.round)} · {race.locality}
              </p>
              <h2 className="font-display text-xl leading-tight font-extrabold tracking-[-0.03em] text-mist-50 sm:text-2xl">
                {race.raceName}
              </h2>
              <p className="mt-2 flex flex-wrap items-center gap-x-2.5 text-[12px] text-mist-400">
                <Flag country={race.country} />
                {race.circuitName}
                <span className="text-mist-600">·</span>
                <span className="font-mono">{formatDate(raceStart)}</span>
              </p>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="eyebrow mb-1.5 sm:justify-end">Lights out</p>
              <p className="num text-xl leading-none font-bold text-f1-red-bright">
                {formatTime(raceStart)}
              </p>
              <p className="mt-1.5 font-mono text-[10px] text-mist-500">
                {relativeDayLabel(raceStart)} · {formatTimeZoned(raceStart).split(' ').slice(1).join(' ')}
              </p>
            </div>
          </div>
        </Panel>
      )}

      {/* ---- Weekend clock ---- */}
      <Panel className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow mb-1.5">Weekend clock</p>
          <p className="text-[12.5px] text-mist-400">
            Your local time, live. Every session below is shown on the same clock.
          </p>
        </div>
        <MatrixClock
          withSeconds
          className="h-10 w-auto text-f1-red-bright sm:h-12"
        />
      </Panel>

      {/* ---- Session list ---- */}
      <Panel flush>
        {error ? (
          <ErrorState message={error.message} onRetry={refresh} />
        ) : loadingRaces || loading ? (
          <div className="p-5 sm:p-6">
            <SkeletonRows rows={6} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No session times yet"
            description="Practice, qualifying and race times are published closer to the weekend."
          />
        ) : (
          <div className="px-2 py-2 sm:px-3">
            <InteractiveTimeline items={timelineItems} />
          </div>
        )}
      </Panel>

      {/* ---- Notification prompt ---- */}
      <Panel className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-mist-50">
              {notifications.enabled
                ? 'Session alerts are on'
                : 'Never miss lights out'}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-mist-400">
              {notifications.enabled
                ? "We'll ping you 5 minutes before each session and again when it goes live."
                : notifications.state === 'denied'
                  ? 'Alerts are blocked for this site in your browser settings.'
                  : 'Get a browser alert 5 minutes before each session, and one when it goes live.'}
            </p>
          </div>
        </div>
        {notifications.state !== 'denied' && notifications.state !== 'unsupported' && (
          <Button
            size="sm"
            variant={notifications.enabled ? 'secondary' : 'primary'}
            onClick={() =>
              notifications.enabled ? notifications.disable() : void notifications.enable()
            }
            className="shrink-0"
          >
            {notifications.enabled ? 'Turn off' : 'Enable alerts'}
          </Button>
        )}
      </Panel>

      {/* ---- Day/night note ---- */}
      <p className="mt-4 flex flex-wrap items-center justify-center gap-4 text-center font-mono text-[10px] text-mist-600">
        <span>Day sessions · Night races converted to local time</span>
        <Link to="/calendar" className="link-wipe text-mist-400 hover:text-mist-200">
          Full calendar
        </Link>
      </p>
    </PageContainer>
  );
}
