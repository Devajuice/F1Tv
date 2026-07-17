import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Calendar, Eye, Film, Trophy, Flag, Timer, Zap } from 'lucide-react';

interface HighlightVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  views: string;
}

type Tab = 'race' | 'sprint' | 'qualifying';

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
  { id: 'rx41vYOBLFE', title: 'Qualifying Highlights | 2026 British Grand Prix', thumbnail: 'https://i.ytimg.com/vi/rx41vYOBLFE/hqdefault.jpg', published: '2026-07-04', views: '3.3M' },
  { id: 'sZb7_vNeA9o', title: 'Qualifying Highlights | 2026 Austrian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/sZb7_vNeA9o/hqdefault.jpg', published: '2026-06-27', views: '4.0M' },
  { id: 'Q2fMM4H9bWY', title: 'Qualifying Highlights | 2026 Barcelona-Catalunya Grand Prix', thumbnail: 'https://i.ytimg.com/vi/Q2fMM4H9bWY/hqdefault.jpg', published: '2026-06-13', views: '3.9M' },
  { id: 'xmk0j-HdgwY', title: 'Qualifying Highlights | 2026 Monaco Grand Prix', thumbnail: 'https://i.ytimg.com/vi/xmk0j-HdgwY/hqdefault.jpg', published: '2026-06-06', views: '4.3M' },
  { id: 'rjLDgDc0td4', title: 'Qualifying Highlights | 2026 Canadian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/rjLDgDc0td4/hqdefault.jpg', published: '2026-05-23', views: '3.0M' },
  { id: '83GJM1S0FnE', title: 'Qualifying Highlights | 2026 Miami Grand Prix', thumbnail: 'https://i.ytimg.com/vi/83GJM1S0FnE/hqdefault.jpg', published: '2026-05-02', views: '3.5M' },
  { id: 'oZH_7pYJPTE', title: 'Qualifying Highlights | 2026 Japanese Grand Prix', thumbnail: 'https://i.ytimg.com/vi/oZH_7pYJPTE/hqdefault.jpg', published: '2026-03-28', views: '4.5M' },
  { id: 'QztBs3IZBHk', title: 'Qualifying Highlights | 2026 Australian Grand Prix', thumbnail: 'https://i.ytimg.com/vi/QztBs3IZBHk/hqdefault.jpg', published: '2026-03-17', views: '5.1M' },
];

const TABS: { key: Tab; label: string; icon: React.ReactNode; data: HighlightVideo[] }[] = [
  { key: 'race', label: 'Race', icon: <Flag size={14} />, data: RACE_HIGHLIGHTS },
  { key: 'sprint', label: 'Sprint', icon: <Zap size={14} />, data: SPRINT_HIGHLIGHTS },
  { key: 'qualifying', label: 'Qualifying', icon: <Timer size={14} />, data: QUALIFYING_HIGHLIGHTS },
];

export default function Highlights() {
  const [tab, setTab] = useState<Tab>('race');
  const videos = TABS.find((t) => t.key === tab)!.data;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', maxWidth: 1100, margin: '0 auto' }} className="slide-down">
        <Link to="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontStyle: 'italic' }}>F1</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#e10600', fontStyle: 'italic' }}>TV</span>
        </Link>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link to="/home" className="glass nav-link" style={{ padding: '6px 12px', borderRadius: 8, color: '#a3a3a3', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
            <ArrowLeft size={13} /> Schedule
          </Link>
          <Link to="/standings" className="glass nav-link" style={{ padding: '6px 12px', borderRadius: 8, color: '#a3a3a3', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Trophy size={13} /> Standings
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }} className="fade-in-up">
          <Film size={24} color="#e10600" />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Highlights</h1>
        </div>
        <p style={{ fontSize: 13, color: '#525252', marginBottom: 20 }} className="fade-in-up">Official highlights from the FORMULA 1 YouTube channel</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.03)', marginBottom: 24, maxWidth: 400 }} className="fade-in-up">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: 'none', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'inherit',
                background: tab === t.key ? 'rgba(225,6,0,0.15)' : 'transparent',
                color: tab === t.key ? '#e10600' : '#737373',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {videos.map((video) => (
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
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(225,6,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(225,6,0,0.4)',
                }}>
                  <Play size={22} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                </div>
                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.8)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Eye size={11} /> {video.views}
                </div>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4, margin: 0 }}>{video.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, color: '#525252' }}>
                  <Calendar size={11} /> {video.published}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 24px', textAlign: 'center', fontSize: 12, color: '#404040', marginTop: 48 }}>
        Highlights from the official FORMULA 1 YouTube channel &mdash; Made by{' '}
        <a href="https://github.com/Devajuice" target="_blank" rel="noopener noreferrer" style={{ color: '#e10600', textDecoration: 'none' }}>
          Devajuice
        </a>
      </footer>
    </div>
  );
}
