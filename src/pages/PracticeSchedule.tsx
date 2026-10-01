import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, Clock, Moon, Sun } from 'lucide-react';
import { getPracticeSchedule, getSchedule, type PracticeSession, type Race } from '../api/f1Api';
import { getSessionMeta } from '../data/sessions';
import { useSession } from '../context/SessionContext';
import { useNotifications } from '../context/NotificationsContext';
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
import { cn } from '../lib/cn';

export default function PracticeSchedule() {
  useDocumentTitle('Weekend Schedule');
  const [round, setRound] = useState('');
  const { live } = useSession();
  const notifications = useNotifications();

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
        <Panel className="notched relative mb-4 overflow-hidden">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <TrackMap circuit={race.locality} round={race.round} className="size-16 sm:size-20" />
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-2 flex items-center gap-2">
                <span className="accent-bar inline-block h-3 w-1.5" />
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
            icon={<CalendarDays size={18} />}
            title="No session times yet"
            description="Practice, qualifying and race times are published closer to the weekend."
          />
        ) : (
          <ul className="divide-y divide-line/[0.05]">
            {rows.map((session) => {
              const start = joinDateTime(session.date, session.time);
              const meta = getSessionMeta(session.name);
              const isLive = liveSessionName === session.name;
              const isPast = start ? start.getTime() + 90 * 60_000 < Date.now() : false;

              return (
                <li
                  key={`${session.name}-${session.date}`}
                  className={cn(
                    'flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-colors sm:px-6',
                    isLive
                      ? 'bg-live/8'
                      : isPast
                        ? 'opacity-45'
                        : 'hover:bg-veil/[0.025]',
                  )}
                >
                  <span
                    className={cn(
                      'num flex h-10 w-16 shrink-0 items-center justify-center rounded-xs border font-mono text-[10.5px] font-bold tracking-[0.02em]',
                      meta.surface,
                      meta.color,
                    )}
                  >
                    {meta.badge}
                  </span>

                  <span className="min-w-40 flex-1">
                    <span className="block text-[13.5px] font-semibold text-mist-50">
                      {meta.label}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 font-mono text-[10.5px] text-mist-500">
                      <Clock size={9} />
                      {formatDate(start)} · {relativeDayLabel(start)}
                    </span>
                  </span>

                  {isLive && <LiveDot label="Live" className="shrink-0" />}

                  <span className="ml-auto shrink-0 text-right">
                    <span className="num block text-[17px] leading-none font-bold text-mist-50">
                      {formatTimeZoned(start)}
                    </span>
                    <span className="mt-1 block font-mono text-[9.5px] text-mist-500">
                      your time
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {/* ---- Notification prompt ---- */}
      <Panel className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full border',
              notifications.enabled
                ? 'border-turf/35 bg-turf/10 text-turf'
                : 'border-line/10 bg-veil/[0.04] text-mist-400',
            )}
          >
            <Bell size={16} />
          </span>
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
      <p className="mt-4 flex items-center justify-center gap-4 text-center font-mono text-[10px] text-mist-600">
        <span className="inline-flex items-center gap-1.5">
          <Sun size={10} /> Day sessions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Moon size={10} /> Night races converted to local time
        </span>
        <Link to="/calendar" className="link-wipe text-mist-400 hover:text-mist-200">
          Full calendar
        </Link>
      </p>
    </PageContainer>
  );
}
