import { Link } from 'react-router-dom';
import { Home, Film, Trophy } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

export default function NotFound() {
  return (
    <PageWrapper>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
        <div className="fade-in-up">
          <h1 style={{ fontSize: 'clamp(72px, 15vw, 120px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 8 }}>
            <span style={{ color: '#fff' }}>4</span>
            <span style={{ color: '#e10600' }}>0</span>
            <span style={{ color: '#fff' }}>4</span>
          </h1>
          <p style={{ fontSize: 14, color: '#737373', marginBottom: 32, maxWidth: 300 }}>
            This page has gone off track. Let's get you back in the race.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }} className="fade-in-up" >
          <Link to="/home" className="btn-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            <Home size={15} /> Back to Home
          </Link>
          <Link to="/highlights" className="glass glass-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', color: '#a3a3a3' }}>
            <Film size={15} /> Highlights
          </Link>
          <Link to="/standings" className="glass glass-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', color: '#a3a3a3' }}>
            <Trophy size={15} /> Standings
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
