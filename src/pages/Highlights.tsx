import { useMemo, useState } from 'react';
import { ExternalLink, Eye, Play, Zap, Flag, Timer } from 'lucide-react';
import {
  fetchAllHighlights,
  type HighlightType,
  type YoutubeVideo,
} from '../api/youtube';
import { formatCompact, timeAgo } from '../lib/format';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageContainer, PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Tabs } from '../components/ui/Tabs';
import { ArticlePlaceholder } from '../components/ui/Atoms';
import { EmptyState, ErrorState, RefreshHint } from '../components/ui/States';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

const TABS: Array<{ value: HighlightType; label: string; icon: typeof Zap }> = [
  { value: 'race', label: 'Race', icon: Zap },
  { value: 'sprint', label: 'Sprint', icon: Timer },
  { value: 'qualifying', label: 'Qualifying', icon: Flag },
];

/** Videos per page. */
const PAGE = 6;

export default function Highlights() {
  useDocumentTitle('Highlights');
  const [tab, setTab] = useState<HighlightType>('race');
  const [limit, setLimit] = useState(PAGE);

  const { data, loading, error, refresh, refreshing, lastFetchedAt } =
    useAsync(() => fetchAllHighlights(), [], { intervalMs: 30 * 60_000 });

  const videos = useMemo(() => data?.[tab] ?? [], [data, tab]);
  const shown = videos.slice(0, limit);

  const counts = useMemo(
    () => ({
      race: data?.race.length ?? 0,
      sprint: data?.sprint.length ?? 0,
      qualifying: data?.qualifying.length ?? 0,
    }),
    [data],
  );

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const top = shown[0];

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <PageHeader
        eyebrow={total > 0 ? `${total} videos` : 'Official channel'}
        title="Highlights"
        description="Race, Sprint and qualifying highlights from the official Formula 1 YouTube channel."
        actions={
          <RefreshHint
            at={lastFetchedAt}
            onRefresh={refresh}
            busy={refreshing}
          />
        }
      >
        {total > 0 && (
          <div className="mt-6">
            <Tabs
              items={TABS.map((t) => ({
                value: t.value,
                label: t.label,
                hint: counts[t.value] ? String(counts[t.value]) : undefined,
              }))}
              value={tab}
              onChange={(v) => {
                setTab(v);
                setLimit(PAGE);
              }}
              accent={(v) =>
                v === 'sprint'
                  ? 'var(--color-purple-fp)'
                  : v === 'qualifying'
                    ? 'var(--color-sodium)'
                    : 'var(--color-f1-red)'
              }
              aria-label="Highlight type"
            />
          </div>
        )}
      </PageHeader>

      {error ? (
        <Panel className="mt-4">
          <ErrorState
            title="Couldn't load highlights"
            message={error.message}
            onRetry={refresh}
          />
        </Panel>
      ) : loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2.5">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <Panel className="mt-4">
          <EmptyState
            icon={<Play size={18} />}
            title={`No ${TABS.find((t) => t.value === tab)?.label.toLowerCase()} highlights yet`}
            description="Highlight videos are published after each session. Check back shortly, or watch the live stream."
            action={
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-line/12 bg-veil/5 px-3 text-[10px] font-semibold tracking-[0.08em] text-mist-100 uppercase transition-colors hover:border-line/25 hover:bg-veil/10"
              >
                Open the F1 YouTube channel
                <ExternalLink size={11} />
              </a>
            }
          />
        </Panel>
      ) : (
        <>
          {/* ---- Feature ---- */}
          {top && limit >= PAGE && <Feature video={top} />}

          {/* ---- Grid ---- */}
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((video) => (
              <li key={video.id}>
                <Card video={video} />
              </li>
            ))}
          </ul>

          {limit < videos.length && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => setLimit((l) => l + PAGE)}
              >
                Load more ({videos.length - limit} left)
              </Button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

const CHANNEL_URL = 'https://www.youtube.com/@formula1';

function Feature({ video }: { video: YoutubeVideo }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noreferrer noopener"
      className="group relative block overflow-hidden rounded-md border border-line/10 bg-ink-900"
    >
      <div className="relative aspect-[21/9] w-full overflow-hidden">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <ArticlePlaceholder className="size-full" />
        )}
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/35 to-transparent"
        />
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1 bg-f1-red"
        />
      </div>

      <div className="relative -mt-10 px-5 pb-5 sm:px-6 sm:pb-6">
        <p className="eyebrow mb-2 flex items-center gap-2">
          <span className="accent-bar inline-block h-3 w-1.5" />
          Latest · {timeAgo(video.published)}
        </p>
        <h2 className="line-clamp-2 max-w-2xl font-display text-lg leading-tight font-extrabold tracking-[-0.02em] text-mist-50 sm:text-xl">
          {video.title}
        </h2>
        <p className="num mt-2 font-mono text-[10.5px] text-mist-500">
          {formatCompact(video.views)} views
        </p>
      </div>
    </a>
  );
}

function Card({ video }: { video: YoutubeVideo }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noreferrer noopener"
      className="group block"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-sm border border-line/8 bg-ink-900">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ArticlePlaceholder className="size-full" />
        )}
        <span
          aria-hidden
          className="absolute inset-0 bg-ink-950/0 transition-colors duration-300 group-hover:bg-ink-950/35"
        />
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          )}
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-f1-red text-white shadow-lg shadow-black/50">
            <Play size={16} className="ml-0.5" fill="currentColor" />
          </span>
        </span>
        {video.views && (
          <span className="num absolute right-2 bottom-2 rounded-xs bg-ink-950/85 px-1.5 py-0.5 font-mono text-[9.5px] text-mist-200 backdrop-blur-sm">
            <Eye size={9} className="mr-1 inline" />
            {formatCompact(video.views)}
          </span>
        )}
      </div>

      <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-snug font-semibold text-mist-100 transition-colors group-hover:text-mist-50">
        {video.title}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-mist-500">
        {timeAgo(video.published)}
        <ExternalLink size={9} className="opacity-0 transition-opacity group-hover:opacity-100" />
      </p>
    </a>
  );
}
