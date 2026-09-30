import { useMemo, useState } from 'react';
import { ArrowUpRight, Clock, Newspaper } from 'lucide-react';
import { fetchNews, type NewsArticle } from '../api/news';
import { timeAgo } from '../lib/format';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageContainer, PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { ArticlePlaceholder } from '../components/ui/Atoms';
import { EmptyState, ErrorState, RefreshHint } from '../components/ui/States';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';

const ALL = 'all';

export default function News() {
  useDocumentTitle('News');
  const [source, setSource] = useState<string>(ALL);

  const { data, loading, error, refresh, refreshing, lastFetchedAt } =
    useAsync<NewsArticle[]>(() => fetchNews(), [], { intervalMs: 10 * 60_000 });

  const articles = useMemo(() => data ?? [], [data]);

  const sources = useMemo(() => {
    const unique = new Map<string, string>();
    for (const a of articles) unique.set(a.source, a.sourceUrl);
    return [...unique.entries()];
  }, [articles]);

  const visible = useMemo(
    () => (source === ALL ? articles : articles.filter((a) => a.source === source)),
    [articles, source],
  );

  const [lead, ...rest] = visible;

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <PageHeader
        eyebrow={
          articles.length
            ? `${articles.length} stories from ${sources.length} sources`
            : 'Autosport · The Race · Motorsport.com'
        }
        title="News"
        description="The latest Formula 1 headlines, aggregated from the specialist newsrooms and refreshed every ten minutes."
        actions={
          <RefreshHint
            at={lastFetchedAt}
            onRefresh={refresh}
            busy={refreshing}
          />
        }
      >
        {sources.length > 1 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <SourceChip
              active={source === ALL}
              onClick={() => setSource(ALL)}
              label="All sources"
            />
            {sources.map(([name, url]) => (
              <SourceChip
                key={name}
                active={source === name}
                onClick={() => setSource(name)}
                label={name}
                href={url}
              />
            ))}
          </div>
        )}
      </PageHeader>

      {error ? (
        <Panel className="mt-4">
          <ErrorState
            title="Couldn't load the news feed"
            message={error.message}
            onRetry={refresh}
          />
        </Panel>
      ) : loading ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-52 w-full" />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ) : visible.length === 0 ? (
        <Panel className="mt-4">
          <EmptyState
            icon={<Newspaper size={18} />}
            title="No stories right now"
            description="The feeds are empty or unreachable at the moment. Try again shortly."
            action={
              <Button variant="secondary" size="sm" onClick={refresh}>
                Reload feeds
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          {lead && <Lead article={lead} />}

          {rest.length > 0 && (
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {rest.map((article) => (
                <li key={article.link}>
                  <Row article={article} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </PageContainer>
  );
}

function SourceChip({
  active,
  onClick,
  label,
  href,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  href?: string;
}) {
  const className = cn(
    'rounded-xs border px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase transition-colors',
    active
      ? 'border-f1-red/45 bg-f1-red/12 text-mist-50'
      : 'border-white/10 bg-white/[0.03] text-mist-400 hover:border-white/20 hover:text-mist-200',
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
        title={`Open ${label} ↗`}
      >
        {label}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={className}>
      {label}
    </button>
  );
}

function Lead({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noreferrer noopener"
      className="group relative block overflow-hidden rounded-md border border-white/10 bg-ink-900"
    >
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[300px]">
          {article.thumbnail ? (
            <img
              src={article.thumbnail}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <ArticlePlaceholder className="size-full" />
          )}
          <span
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-ink-950/70 to-transparent md:bg-linear-to-r"
          />
        </div>

        <div className="relative flex flex-col justify-center p-5 sm:p-7">
          <span
            aria-hidden
            className="accent-bar absolute top-6 left-0 h-8 w-1 sm:top-8"
          />
          <p className="eyebrow mb-3 flex items-center gap-2">
            {article.source}
            <span className="text-mist-600">·</span>
            <span className="num font-mono">{timeAgo(article.pubDate)}</span>
          </p>
          <h2 className="font-display text-xl leading-tight font-extrabold tracking-[-0.03em] text-mist-50 sm:text-2xl lg:text-[26px]">
            {article.title}
          </h2>
          {article.description && (
            <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-mist-400">
              {article.description}
            </p>
          )}
          <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] text-mist-500 uppercase group-hover:text-f1-red-bright">
            Read story
            <ArrowUpRight
              size={12}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </p>
        </div>
      </div>
    </a>
  );
}

function Row({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex h-full gap-3.5 rounded-sm border border-white/8 bg-white/[0.02] p-3 transition-colors hover:border-white/16 hover:bg-white/[0.045]"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xs bg-ink-900 sm:size-24">
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ArticlePlaceholder className="size-full" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="eyebrow mb-1.5 flex items-center gap-1.5">
          {article.source}
          <span className="inline-flex items-center gap-1 normal-case">
            <Clock size={9} />
            <span className="num font-mono normal-case">
              {timeAgo(article.pubDate)}
            </span>
          </span>
        </p>
        <h3 className="line-clamp-2 text-[12.5px] leading-snug font-semibold text-mist-100 transition-colors group-hover:text-mist-50">
          {article.title}
        </h3>
        {article.description && (
          <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-mist-500">
            {article.description}
          </p>
        )}
      </div>
    </a>
  );
}
