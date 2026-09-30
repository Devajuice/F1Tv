import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
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
  const legend = allTeams.filter(
    (t) => !['rb', 'sauber'].includes(t.id), // aliases of racing_bulls / kick_sauber
  );

  return (
    <footer className="hairline-t mt-16 bg-ink-900/40 sm:mt-24">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <div aria-hidden className="flex flex-col gap-[3px] skew-x-[-18deg]">
              <span className="h-[3px] w-6 rounded-[1px] bg-f1-red" />
              <span className="h-[3px] w-4 rounded-[1px] bg-mist-100" />
              <span className="h-[3px] w-2.5 rounded-[1px] bg-mist-500" />
            </div>
            <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-mist-500">
              Live Formula 1 streaming, timing, weather and championship data.
              Built on the Jolpica and OpenF1 open feeds.
            </p>
            <p className="mt-4 text-[11.5px] text-mist-600">
              Not affiliated with Formula 1 or the FIA.
            </p>
          </div>

          {/* Navigation */}
          <nav>
            <p className="eyebrow mb-3">Explore</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {RESOURCES.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="link-wipe inline-block text-[12.5px] text-mist-400 transition-colors hover:text-mist-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Team livery legend */}
          <div>
            <p className="eyebrow mb-3">Constructors</p>
            <ul className="flex flex-wrap gap-1.5">
              {legend.map((team) => (
                <li key={team.id}>
                  <span
                    title={getTeam(team.fullName).fullName}
                    className="inline-flex items-center gap-1.5 rounded-xs border border-white/8 bg-white/[0.03] px-1.5 py-1 text-[10.5px] text-mist-400"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    {team.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hairline-t mt-9 flex flex-col items-start justify-between gap-3 pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[10.5px] tracking-[0.04em] text-mist-500">
            Data by{' '}
            <a
              href="https://jolpi.ca/ergast/f1/"
              target="_blank"
              rel="noreferrer noopener"
              className="link-wipe inline-flex items-center gap-1 text-mist-300"
            >
              Jolpica
              <ExternalLink size={9} />
            </a>
            {' · '}
            <a
              href="https://openf1.org/"
              target="_blank"
              rel="noreferrer noopener"
              className="link-wipe inline-flex items-center gap-1 text-mist-300"
            >
              OpenF1
              <ExternalLink size={9} />
            </a>
          </p>
          <p className="font-mono text-[10.5px] text-mist-500">
            Made by{' '}
            <a
              href="https://github.com/Devajuice"
              target="_blank"
              rel="noreferrer noopener"
              className="link-wipe text-f1-red"
            >
              Devajuice
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
