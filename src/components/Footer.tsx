import { Link } from 'react-router-dom';
import { getTeam, allTeams } from '../data/teams';

// The mobile tab bar only surfaces four destinations, so this list is the
// only route to Qualifying, Grid and the weekend schedule on small screens.
const RESOURCES = [
  { to: '/standings', label: 'Standings' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/highlights', label: 'Highlights' },
  { to: '/news', label: 'News' },
  { to: '/drivers', label: 'Drivers' },
  { to: '/stream', label: 'Watch live' },
  { to: '/results', label: 'Race Result' },
  { to: '/qualifying', label: 'Qualifying' },
  { to: '/grid', label: 'Starting Grid' },
  { to: '/schedule', label: 'Weekend' },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line/10 sm:mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 rounded-2xl border border-line/10 bg-ink-850/35 p-6 backdrop-blur-sm sm:p-8 lg:grid-cols-[1.35fr_1fr_1.15fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-md bg-f1-red text-[11px] font-black text-white">F1</span>
              <p className="font-display text-[20px] font-black tracking-[-0.04em] text-mist-50">F1TV</p>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-mist-400">
              A redesigned Formula 1 companion for live streams, session timing, standings, results and highlights — fast, clear and built for race weekends.
            </p>
            <p className="mt-4 font-mono text-[10.5px] tracking-[0.06em] text-mist-500 uppercase">
              Unofficial fan project · Not affiliated with Formula 1 or the FIA
            </p>
          </div>

          <nav>
            <p className="eyebrow mb-3">Explore</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {RESOURCES.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="link-wipe inline-block text-[13px] text-mist-300 transition-colors hover:text-mist-50"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow mb-3">Constructors</p>
            <ul className="flex flex-wrap gap-1.5">
              {allTeams.map((team) => (
                <li key={team.id}>
                  <span
                    title={getTeam(team.fullName).fullName}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line/10 bg-ink-900/30 px-2 py-1 text-[10.5px] text-mist-400"
                  >
                    <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: team.color }} />
                    {team.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-3 px-1 sm:flex-row sm:items-center">
          <p className="font-mono text-[10.5px] tracking-[0.04em] text-mist-500">
            Data by{' '}
            <a href="https://jolpi.ca/ergast/f1/" target="_blank" rel="noreferrer noopener" className="link-wipe text-mist-300">
              Jolpica
            </a>{' '}
            ·{' '}
            <a href="https://openf1.org/" target="_blank" rel="noreferrer noopener" className="link-wipe text-mist-300">
              OpenF1
            </a>
          </p>
          <p className="font-mono text-[10.5px] text-mist-500">
            Made by{' '}
            <a href="https://github.com/Devajuice" target="_blank" rel="noreferrer noopener" className="link-wipe text-mist-100">
              Devajuice
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
