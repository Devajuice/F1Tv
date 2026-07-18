import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { fetchNews, type NewsArticle } from '../api/news';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const SOURCE_COLORS: Record<string, string> = {
  'Motorsport.com': '#e10600',
  'Autosport': '#0066cc',
  'The Race': '#ff4444',
};

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  const load = (isRefresh = false) => {
    if (isRefresh) setLoadingMore(true);
    else setLoading(true);
    fetchNews()
      .then(setArticles)
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => { load(); }, []);

  const visible = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  return (
    <PageWrapper>
      <Header showBack backTo="/home" backLabel="Home" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Newspaper size={22} color="#e10600" /> F1 News
          </h1>
          <button
            onClick={() => load(true)}
            disabled={loadingMore}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#a3a3a3', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <RefreshCw size={12} className={loadingMore ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass" style={{ borderRadius: 14, overflow: 'hidden' }}>
                <div className="skeleton" style={{ width: '100%', height: 160 }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton skeleton-text" style={{ width: '70%', height: 14, marginBottom: 8 }} />
                  <div className="skeleton skeleton-text" style={{ width: '100%', height: 10, marginBottom: 4 }} />
                  <div className="skeleton skeleton-text" style={{ width: '90%', height: 10 }} />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="glass" style={{ borderRadius: 14, padding: 48, textAlign: 'center', color: '#737373' }}>
            No news articles available
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {visible.map((article, i) => (
                <a
                  key={`${article.source}-${article.link}`}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass glass-hover stagger-in"
                  style={{
                    borderRadius: 14, overflow: 'hidden', textDecoration: 'none',
                    display: 'flex', flexDirection: 'column', animationDelay: `${Math.min(i * 0.03, 0.3)}s`,
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '100%', height: 160, background: 'rgba(255,255,255,0.03)',
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {article.thumbnail ? (
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Newspaper size={32} color="#333" />
                      </div>
                    )}
                    {/* Source badge */}
                    <span style={{
                      position: 'absolute', top: 8, left: 8,
                      fontSize: 10, fontWeight: 700, color: '#fff',
                      background: SOURCE_COLORS[article.source] ?? '#555',
                      padding: '3px 8px', borderRadius: 4,
                    }}>
                      {article.source}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                      fontSize: 14, fontWeight: 700, color: '#fff',
                      margin: '0 0 8px', lineHeight: 1.35,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}>
                      {article.title}
                    </h3>
                    <p style={{
                      fontSize: 12, color: '#737373', margin: 0, lineHeight: 1.5,
                      flex: 1,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}>
                      {article.description}
                    </p>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginTop: 10, paddingTop: 10,
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <span style={{ fontSize: 11, color: '#525252' }}>{timeAgo(article.pubDate)}</span>
                      <ExternalLink size={11} color="#525252" />
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  onClick={() => setVisibleCount((v) => v + 12)}
                  className="glass"
                  style={{
                    padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', color: '#d4d4d4', border: 'none', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                >
                  Load More ({articles.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } } .spin { animation: spin 1s linear infinite; }`}</style>
      <Footer />
    </PageWrapper>
  );
}
