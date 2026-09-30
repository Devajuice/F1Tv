import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Home as HomeIcon, Radio } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageContainer } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { ButtonLink } from '../components/ui/Button';

const SUGGESTIONS = [
  { to: '/home', label: 'Dashboard', icon: HomeIcon, hint: 'Live timing, weather and standings' },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, hint: 'Every round of the season' },
  { to: '/stream', label: 'Watch live', icon: Radio, hint: 'Stream the session' },
] as const;

export default function NotFound() {
  useDocumentTitle('Page not found');

  return (
    <PageContainer className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg text-center">
        <p className="speedlines mb-6" aria-hidden />

        <p className="eyebrow mb-3 justify-center">Error 404</p>
        <p className="num font-display text-[80px] leading-none font-black tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.16)] sm:text-[120px]">
          404
        </p>

        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-mist-50 sm:text-3xl">
          Wrong side of the barrier
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-mist-400">
          That page isn't on the circuit map. It may have been moved, or the link
          may be out of date.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <ButtonLink to="/home" variant="primary" size="md">
            <ArrowLeft size={13} />
            Back to the paddock
          </ButtonLink>
          <ButtonLink to="/calendar" variant="secondary" size="md">
            Season calendar
          </ButtonLink>
        </div>

        <Panel className="mt-10 text-left">
          <p className="eyebrow mb-3">Try one of these</p>
          <ul className="flex flex-col gap-1.5">
            {SUGGESTIONS.map(({ to, label, icon: Icon, hint }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex items-center gap-3 rounded-xs px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xs border border-white/10 bg-white/[0.04] text-mist-400 transition-colors group-hover:border-f1-red/40 group-hover:text-f1-red-bright">
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold text-mist-100">
                      {label}
                    </span>
                    <span className="block text-[11px] text-mist-500">{hint}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-mist-600 transition-colors group-hover:text-mist-300">
                    {to}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageContainer>
  );
}
