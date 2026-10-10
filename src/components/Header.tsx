import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { useTheme } from '../context/ThemeContext'
import { getSessionMeta } from '../data/sessions'
import { cn } from '../lib/cn'
import SettingsPanel from './SettingsPanel'

interface NavItem {
  to: string
  label: string
  description?: string
}

interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    id: 'race',
    label: 'Race',
    items: [
      { to: '/highlights', label: 'Highlights', description: 'Official F1 videos' },
      { to: '/calendar', label: 'Calendar', description: 'Full season schedule' },
      { to: '/schedule', label: 'Weekend', description: 'Session times' },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    items: [
      { to: '/standings', label: 'Standings', description: 'Championship tables' },
      { to: '/results', label: 'Race Result', description: 'Finishing order' },
      { to: '/qualifying', label: 'Qualifying', description: 'Q1 / Q2 / Q3' },
      { to: '/grid', label: 'Starting Grid', description: 'Grid formation' },
    ],
  },
  {
    id: 'info',
    label: 'Info',
    items: [
      { to: '/drivers', label: 'Drivers', description: 'Grid and profiles' },
      { to: '/news', label: 'News', description: 'Latest headlines' },
    ],
  },
]

/** Mobile destinations. Text only — no icons, in keeping with the rest. */
const MOBILE_TABS: NavItem[] = [
  { to: '/home', label: 'Home' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/standings', label: 'Standings' },
  { to: '/results', label: 'Results' },
]

export default function Header() {
  const location = useLocation()
  const { live } = useSession()
  const { theme, toggle } = useTheme()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  /* --- Close everything on navigation ------------------------------------- */
  useEffect(() => {
    setOpenGroup(null)
  }, [location.pathname])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const scheduleClose = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenGroup(null), 140)
  }
  const cancelClose = () => clearTimeout(closeTimer.current)

  const liveMeta = live ? getSessionMeta(live.session_name, live.session_type) : null
  const isLive = Boolean(live && liveMeta)

  return (
    <>
      {/* Fixed flat bar, so it needs a matching spacer in normal flow. */}
      <div className="h-14" />

      <header className="fixed inset-x-0 top-0 z-60 h-14 border-b border-line/8 bg-ink-900">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/home"
            className="shrink-0 transition-opacity duration-200 hover:opacity-80"
            aria-label="F1TV home"
          >
            <span className="font-display text-[20px] font-black tracking-[-0.04em] text-mist-50">
              F1TV
            </span>
          </Link>

          {/* Live flag — only present while a session is actually running. */}
          {isLive && (
            <Link
              to="/stream"
              className="hidden items-center gap-2 rounded-xs border border-live/40 bg-live/10 px-2 py-1 text-live transition-colors hover:bg-live/15 sm:flex"
            >
              <span className="relative flex size-1.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-live" />
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
                {liveMeta!.label} live
              </span>
            </Link>
          )}

          {/* ---- Desktop nav ---- */}
          <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
            {NAV.map((group, groupIndex) => {
              const activeItem = group.items.find((i) =>
                location.pathname.startsWith(i.to),
              )
              const open = openGroup === group.id
              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => {
                    cancelClose()
                    setOpenGroup(group.id)
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="true"
                    onClick={() => setOpenGroup(open ? null : group.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-sm px-3 py-2 text-[12px] font-semibold tracking-[0.05em] uppercase transition-colors duration-200',
                      activeItem
                        ? 'text-mist-50'
                        : 'text-mist-400 hover:text-mist-50',
                    )}
                  >
                    {group.label}
                    <span
                      aria-hidden
                      className={cn(
                        'text-[9px] transition-transform duration-200 ease-swift',
                        open && 'rotate-180',
                      )}
                    >
                      ▼
                    </span>
                  </button>

                  {open && (
                    <div
                      className={cn(
                        'absolute top-full z-50 w-64 pt-2',
                        groupIndex === NAV.length - 1 ? 'right-0' : 'left-0',
                      )}
                    >
                      <div className="rounded-md border border-line/12 bg-ink-850 p-1.5 shadow-[0_18px_40px_-24px_rgb(0_0_0/0.9)]">
                        {group.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-xs px-3 py-2 transition-colors duration-150',
                                isActive
                                  ? 'bg-veil/8 text-mist-50'
                                  : 'text-mist-300 hover:bg-veil/5 hover:text-mist-50',
                              )
                            }
                          >
                            <span className="block text-[12.5px] font-medium">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="block truncate text-[10.5px] text-mist-500">
                                {item.description}
                              </span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="rounded-sm px-2 py-1.5 text-[12px] font-semibold tracking-[0.05em] text-mist-400 uppercase transition-colors duration-200 hover:text-mist-50"
            >
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="hidden rounded-sm px-2 py-1.5 text-[12px] font-semibold tracking-[0.05em] text-mist-400 uppercase transition-colors duration-200 hover:text-mist-50 sm:block"
            >
              Display
            </button>

            <Link
              to="/stream"
              className={cn(
                'group flex h-9 items-center gap-2 rounded-sm px-3.5 text-[11px] font-semibold tracking-[0.07em] uppercase transition-colors duration-200',
                isLive
                  ? 'bg-live text-white hover:brightness-110'
                  : 'border border-line/15 text-mist-200 hover:border-line/30 hover:text-mist-50',
              )}
            >
              {isLive && (
                <span className="relative flex size-1.5 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                </span>
              )}
              <span>{isLive ? 'Watch now' : 'Watch live'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ---- Mobile tab bar: text destinations, pinned within thumb reach ---- */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-60 flex border-t border-line/8 bg-ink-900 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        {MOBILE_TABS.map((item) => {
          const active = location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-1 items-center justify-center py-3 text-[10px] font-semibold tracking-[0.06em] uppercase transition-colors duration-200',
                active ? 'text-mist-50' : 'text-mist-500 hover:text-mist-200',
              )}
            >
              {item.label}
            </NavLink>
          )
        })}
        <NavLink
          to="/stream"
          className={({ isActive }) =>
            cn(
              'flex flex-1 items-center justify-center py-3 text-[10px] font-semibold tracking-[0.06em] uppercase transition-colors duration-200',
              isActive || isLive ? 'text-live' : 'text-mist-500 hover:text-mist-200',
            )
          }
        >
          Live
        </NavLink>
      </nav>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
