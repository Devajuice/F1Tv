interface FooterProps {
  children?: React.ReactNode;
}

export default function Footer({ children }: FooterProps) {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 16px', textAlign: 'center', fontSize: 11, color: '#525252' }}>
      {children ?? (
        <>
          Made by{' '}
          <a href="https://github.com/Devajuice" target="_blank" rel="noopener noreferrer" style={{ color: '#e10600', textDecoration: 'none' }}>
            Devajuice
          </a>
          {' '}&mdash; Not affiliated with Formula 1 or FIA
        </>
      )}
    </footer>
  );
}
