import { useState, useMemo, useEffect } from 'react';
import { Play, Calendar, Eye, Film, Flag, Timer, Zap, ArrowUpDown } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';
import { fetchHighlights, type HighlightType, type YoutubeVideo } from '../api/youtube';

type Tab = HighlightType;
type SortBy = 'recent' | 'views';
type HighlightVideo = YoutubeVideo;

const RACE_HIGHLIGHTS: HighlightVideo[] = [
  { id: 'rnjmSOUYVp8', title: 'Race Highlights | 2026 British Grand Prix', thumbnail: 'https://i.ytimg.com/vi/rnjmSOUYVp8/hqdefault.jpg', published: '2026-07-05', views: '5.4M' },
  { id: 'usP9O0zFVaA', title: 'Race Highlights | 2026 Austrian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/usP9O0zFVaA/hqdefault.jpg', published: '2026-06-28', views: '5.5M' },
  { id: 'Ey8j_BlLvFM', title: 'Race Highlights | 2026 Barcelona-Catalunya Grand Prix', thumbnail: 'https://i.ytimg.com/vi/Ey8j_BlLvFM/hqdefault.jpg', published: '2026-06-14', views: '7.6M' },
  { id: 'ipOT9ruRobc', title: 'Race Highlights | 2026 Monaco Grand Prix', thumbnail: 'https://i.ytimg.com/vi/ipOT9ruRobc/hqdefault.jpg', published: '2026-06-07', views: '7.4M' },
  { id: 'QrRh2vOJQbw', title: 'Race Highlights | 2026 Canadian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/QrRh2vOJQbw/hqdefault.jpg', published: '2026-05-24', views: '7.9M' },
  { id: '5gYys4GL7S0', title: 'Race Highlights | 2026 Miami Grand Prix', thumbnail: 'https://i.ytimg.com/vi/5gYys4GL7S0/hqdefault.jpg', published: '2026-05-03', views: '7.9M' },
  { id: 'oAtYfF0_4-I', title: 'Race Highlights | 2026 Japanese Grand Prix', thumbnail: 'https://i.ytimg.com/vi/oAtYfF0_4-I/hqdefault.jpg', published: '2026-03-29', views: '9.2M' },
  { id: 't8HpVlineX4', title: 'Race Highlights | 2026 Chinese Grand Prix', thumbnail: 'https://i.ytimg.com/vi/t8HpVlineX4/hqdefault.jpg', published: '2026-03-15', views: '9.4M' },
  { id: 'lL_d84cN1UY', title: 'Race Highlights | 2026 Australian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/lL_d84cN1UY/hqdefault.jpg', published: '2026-03-08', views: '12.0M' },
];

const SPRINT_HIGHLIGHTS: HighlightVideo[] = [
  { id: 'v52utVGuAxQ', title: 'Sprint Highlights | 2026 British Grand Prix', thumbnail: 'https://i.ytimg.com/vi/v52utVGuAxQ/hqdefault.jpg', published: '2026-07-04', views: '3.9M' },
  { id: 'l3aB-W19bnc', title: 'Sprint Highlights | 2026 Canadian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/l3aB-W19bnc/hqdefault.jpg', published: '2026-05-23', views: '4.6M' },
  { id: '0XlphgCNbwQ', title: 'Sprint Highlights | 2026 Miami Grand Prix', thumbnail: 'https://i.ytimg.com/vi/0XlphgCNbwQ/hqdefault.jpg', published: '2026-05-02', views: '4.3M' },
  { id: 'ynRZQ9EBfRI', title: 'Sprint Highlights | 2026 Chinese Grand Prix', thumbnail: 'https://i.ytimg.com/vi/ynRZQ9EBfRI/hqdefault.jpg', published: '2026-03-14', views: '6.4M' },
];

const QUALIFYING_HIGHLIGHTS: HighlightVideo[] = [
  { id: 'CmzXqYzymzg', title: 'Qualifying Highlights | 2026 Belgian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/CmzXqYzymzg/hqdefault.jpg', published: '2026-07-18', views: '3.5M' },
  { id: 'rx41vYOBLFE', title: 'Qualifying Highlights | 2026 British Grand Prix', thumbnail: 'https://i.ytimg.com/vi/rx41vYOBLFE/hqdefault.jpg', published: '2026-07-04', views: '3.3M' },
  { id: 'sZb7_vNeA9o', title: 'Qualifying Highlights | 2026 Austrian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/sZb7_vNeA9o/hqdefault.jpg', published: '2026-06-27', views: '4.0M' },
  { id: 'Q2fMM4H9bWY', title: 'Qualifying Highlights | 2026 Barcelona-Catalunya Grand Prix', thumbnail: 'https://i.ytimg.com/vi/Q2fMM4H9bWY/hqdefault.jpg', published: '2026-06-13', views: '3.9M' },
  { id: 'xmk0j-HdgwY', title: 'Qualifying Highlights | 2026 Monaco Grand Prix', thumbnail: 'https://i.ytimg.com/vi/xmk0j-HdgwY/hqdefault.jpg', published: '2026-06-06', views: '4.3M' },
  { id: 'rjLDgDc0td4', title: 'Qualifying Highlights | 2026 Canadian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/rjLDgDc0td4/hqdefault.jpg', published: '2026-05-23', views: '3.0M' },
  { id: '83GJM1S0FnE', title: 'Qualifying Highlights | 2026 Miami Grand Prix', thumbnail: 'https://i.ytimg.com/vi/83GJM1S0FnE/hqdefault.jpg', published: '2026-05-02', views: '3.5M' },
  { id: 'oZH_7pYJPTE', title: 'Qualifying Highlights | 2026 Japanese Grand Prix', thumbnail: 'https://i.ytimg.com/vi/oZH_7pYJPTE/hqdefault.jpg', published: '2026-03-28', views: '4.5M' },
  { id: 'QztBs3IZBHk', title: 'Qualifying Highlights | 2026 Australian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/QztBs3IZBHk/hqdefault.jpg', published: '2026-03-17', views: '5.1M' },
];

function parseViews(v: string): number {
  const num = parseFloat(v);
  if (v.endsWith('M')) return num * 1_000_000;
  if (v.endsWith('K')) return num * 1_000;
  return num;
}

const TABS: { key: Tab; label: string; icon: React.ReactNode; accent: string; accentBg: string }[] = [
  { key: 'race', label: 'Race', icon: <Flag size={14} />, accent: '#e10600', accentBg: 'rgba(225,6,0,0.15)' },
  { key: 'sprint', label: 'Sprint', icon: <Zap size={14} />, accent: '#facc15', accentBg: 'rgba(250,204,21,0.15)' },
  { key: 'qualifying', label: 'Qualifying', icon: <Timer size={14} />, accent: '#60a5fa', accentBg: 'rgba(96,165,250,0.15)' },
];

const PAGE_SIZE = 6;

export default function Highlights() {
  const [tab, setTab] = useState<Tab>('race');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [liveData, setLiveData] = useState<Record<Tab, YoutubeVideo[]>>({
    race: RACE_HIGHLIGHTS,
    sprint: SPRINT_HIGHLIGHTS,
    qualifying: QUALIFYING_HIGHLIGHTS,
  });

  useEffect(() => {
    const tabs: Tab[] = ['race', 'sprint', 'qualifying'];
    tabs.forEach((t) => {
      fetchHighlights(t)
        .then((videos) => {
          if (videos.length > 0) {
            setLiveData((prev) => ({ ...prev, [t]: videos }));
          }
        })
        .catch(() => {});
    });
  }, []);

  const currentTab = TABS.find((t) => t.key === tab)!;
  const currentData = liveData[tab];

  const sortedVideos = useMemo(() => {
    const videos = [...currentData];
    if (sortBy === 'views') {
      videos.sort((a, b) => parseViews(b.views) - parseViews(a.views));
    } else {
      videos.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    }
    return videos;
  }, [currentData, sortBy]);

  const visibleVideos = sortedVideos.slice(0, visibleCount);
  const hasMore = visibleCount < sortedVideos.length;

  return (
    <PageWrapper>
      <Header showBack backTo="/home" backLabel="Home" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }} className="fade-in-up">
          <Film size={24} color="#e10600" />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Highlights</h1>
        </div>
        <p style={{ fontSize: 13, color: '#737373', marginBottom: 20 }} className="fade-in-up">Official highlights from the FORMULA 1 YouTube channel</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.03)', marginBottom: 16, maxWidth: 420 }} className="fade-in-up">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setVisibleCount(PAGE_SIZE); }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: 'none', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit',
                  background: active ? t.accentBg : 'transparent',
                  color: active ? t.accent : '#737373',
                  boxShadow: active ? `inset 0 -2px 0 ${t.accent}` : 'none',
                }}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {/* Sort controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }} className="fade-in-up">
          <span style={{ fontSize: 12, color: '#737373' }}>{sortedVideos.length} videos</span>
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
            {([
              { key: 'recent' as SortBy, label: 'Recent' },
              { key: 'views' as SortBy, label: 'Most Viewed' },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                style={{
                  padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: 'none', transition: 'all 0.15s', fontFamily: 'inherit',
                  background: sortBy === s.key ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: sortBy === s.key ? '#d4d4d4' : '#737373',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {s.key === 'views' && <ArrowUpDown size={10} />}
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {visibleVideos.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass glass-hover"
              style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', textDecoration: 'none', display: 'block' }}
            >
              <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                }} />
                {/* Corner type tag */}
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  background: `${currentTab.accent}cc`, borderRadius: 4,
                  padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  backdropFilter: 'blur(4px)',
                }}>
                  {currentTab.label}
                </div>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 56, height: 56, borderRadius: '50%',
                  background: `${currentTab.accent}e6`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 30px ${currentTab.accent}66`,
                  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s',
                }}>
                  <Play size={22} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                </div>
                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.8)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={11} /> {video.views}
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4, margin: 0 }}>{video.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, color: '#737373' }}>
                  <Calendar size={11} /> {video.published}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 24 }} className="fade-in-up">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="glass"
              style={{
                padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                color: '#d4d4d4', cursor: 'pointer', fontFamily: 'inherit',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            >
              Load More ({sortedVideos.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 48 }}>
        <Footer>
          Highlights from the official FORMULA 1 YouTube channel &mdash; Made by{' '}
          <a href="https://github.com/Devajuice" target="_blank" rel="noopener noreferrer" style={{ color: '#e10600', textDecoration: 'none' }}>
            Devajuice
          </a>
        </Footer>
      </div>
    </PageWrapper>
  );
}
