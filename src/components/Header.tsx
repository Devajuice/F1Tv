import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  Flag,
  Gauge,
  Home,
  Menu,
  Moon,
  Newspaper,
  PlayCircle,
  Radio,
  Settings2,
  Sun,
  Trophy,
  TvMinimalPlay,
  Users,
  X,
} from 'lucide-react'
import { useSession } from '../context/SessionContext'
import { useTheme } from '../context/ThemeContext'
import { getSessionMeta } from '../data/sessions'
import { cn } from '../lib/cn'
import SettingsPanel from './SettingsPanel'

interface NavItem {
  to: string
  label: string
  description?: string
  icon: typeof Home
}

interface NavGroup {
  id: string
  label: string
  icon: typeof Home
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    id: 'race',
    label: 'Race',
    icon: CalendarDays,
    items: [
      { to: '/highlights', label: 'Highlights', description: 'Official F1 videos', icon: TvMinimalPlay },
      { to: '/calendar', label: 'Calendar', description: 'Full season schedule', icon: CalendarDays },
      { to: '/schedule', label: 'Weekend', description: 'Session times', icon: Radio },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    icon: Trophy,
    items: [
      { to: '/standings', label: 'Standings', description: 'Championship tables', icon: Trophy },
      { to: '/results', label: 'Race Result', description: 'Finishing order', icon: Flag },
      { to: '/qualifying', label: 'Qualifying', description: 'Q1 / Q2 / Q3', icon: Gauge },
      { to: '/grid', label: 'Starting Grid', description: 'Grid formation', icon: Users },
    ],
  },
  {
    id: 'info',
    label: 'Info',
    icon: Newspaper,
    items: [
      { to: '/drivers', label: 'Drivers', description: 'Grid and profiles', icon: Users },
      { to: '/news', label: 'News', description: 'Latest headlines', icon: Newspaper },
    ],
  },
]

const MOBILE_TABS: NavItem[] = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/standings', label: 'Standings', icon: Trophy },
  { to: '/results', label: 'Results', icon: Flag },
]

export default function Header() {
  const location = useLocation()
  const { live } = useSession()
  const { theme, toggle } = useTheme()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setOpenGroup(null)
    setMobileMenuOpen(false)
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
      <div className="h-[72px]" />

      <header className="fixed inset-x-0 top-0 z-60 border-b border-line/10 bg-ink-900/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
          <Link to="/home" className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3" aria-label="F1TV home">
            <span className="relative flex size-8 items-center justify-center rounded-md bg-f1-red text-[11px] font-black tracking-[-0.03em] text-white shadow-[0_0_0_1px_rgb(255_255_255/0.15)_inset,0_10px_24px_-12px_var(--pal-f1-red)]">
              F1
            </span>
            <span className="hidden min-w-0 flex-col leading-none xs:flex sm:flex">
              <span className="font-display text-[18px] font-black tracking-[-0.05em] text-mist-50 sm:text-[20px]">F1TV</span>
              <span className="mt-1 hidden font-mono text-[9px] tracking-[0.18em] text-mist-500 uppercase sm:block">Live timing & streams</span>
            </span>
          </Link>

          {isLive && (
            <Link
              to="/stream"
              className="hidden items-center gap-2 rounded-full border border-live/30 bg-live/12 px-3 py-1.5 text-live transition-all hover:border-live/50 hover:bg-live/16 lg:flex"
            >
              <span className="relative flex size-1.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-live" />
              </span>
              <span className="font-mono text-[10px] font-semibold tracking-[0.14em] uppercase">
                {liveMeta!.label} live
              </span>
            </Link>
          )}

          <nav className="ml-1 hidden items-center gap-1 lg:flex">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors',
                  isActive ? 'bg-veil/8 text-mist-50' : 'text-mist-400 hover:text-mist-50',
                )
              }
            >
              <Home className="size-3.5" />
              Home
            </NavLink>
            {NAV.map((group, groupIndex) => {
              const activeItem = group.items.find((i) => location.pathname.startsWith(i.to))
              const open = openGroup === group.id
              const GroupIcon = group.icon
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
                      'flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold tracking-[0.04em] uppercase transition-colors',
                      activeItem || open ? 'bg-veil/8 text-mist-50' : 'text-mist-400 hover:text-mist-50',
                    )}
                  >
                    <GroupIcon className="size-3.5" />
                    {group.label}
                    <ChevronDown aria-hidden className={cn('size-3.5 text-mist-500 transition-transform duration-200', open && 'rotate-180')} />
                  </button>

                  {open && (
                    <div className={cn('absolute top-full z-50 w-72 pt-3', groupIndex === NAV.length - 1 ? 'right-0' : 'left-0')}>
                      <div className="overflow-hidden rounded-xl border border-line/12 bg-ink-850/95 p-2 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl">
                        <p className="px-3 pb-2 pt-1 font-mono text-[9.5px] tracking-[0.16em] text-mist-500 uppercase">{group.label}</p>
                        {group.items.map((item) => {
                          const ItemIcon = item.icon
                          return (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors',
                                  isActive ? 'bg-veil/8 text-mist-50' : 'text-mist-300 hover:bg-veil/5 hover:text-mist-50',
                                )
                              }
                            >
                              <ItemIcon className="mt-0.5 size-4 shrink-0 text-mist-400" />
                              <span className="min-w-0">
                                <span className="block text-[13px] font-semibold">{item.label}</span>
                                {item.description && <span className="mt-0.5 block text-[11px] text-mist-500">{item.description}</span>}
                              </span>
                            </NavLink>
                          )
                        })}
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
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line/12 text-mist-300 transition-colors hover:border-line/25 hover:text-mist-50 lg:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
            <button
              type="button"
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line/12 text-mist-300 transition-colors hover:border-line/25 hover:text-mist-50"
            >
              {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-full border border-line/12 px-3 text-[11px] font-semibold tracking-[0.08em] text-mist-300 uppercase transition-colors hover:border-line/25 hover:text-mist-50 sm:inline-flex"
            >
              <Settings2 className="size-4" />
              Display
            </button>

            <Link
              to="/stream"
              className={cn(
                'group inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-[11px] font-semibold tracking-[0.08em] uppercase transition-all duration-200 sm:px-4',
                isLive
                  ? 'bg-live text-white shadow-[0_10px_30px_-14px_var(--pal-live)] hover:brightness-110'
                  : 'bg-mist-50 text-ink-950 hover:bg-mist-100',
              )}
            >
              <PlayCircle className={cn('size-4', isLive ? 'text-white' : 'text-ink-950')} />
              <span className="hidden sm:inline">{isLive ? 'Watch now' : 'Watch live'}</span>
              <span className="sm:hidden">Watch</span>
            </Link>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-line/10 bg-ink-900/97 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2">
              {NAV.map((group) => (
                <div key={group.id} className="rounded-xl border border-line/10 bg-ink-850/60 p-3">
                  <p className="eyebrow mb-2">{group.label}</p>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                              isActive ? 'bg-veil/8 text-mist-50' : 'text-mist-300 hover:bg-veil/5 hover:text-mist-50',
                            )
                          }
                        >
                          <ItemIcon className="size-4 shrink-0 text-mist-400" />
                          <span>
                            <span className="block font-medium">{item.label}</span>
                            {item.description && <span className="block text-[11px] text-mist-500">{item.description}</span>}
                          </span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line/12 bg-ink-850/60 px-3 py-2.5 text-sm text-mist-200"
                >
                  <Settings2 className="size-4" />
                  Display settings
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-60 rounded-2xl border border-line/12 bg-ink-900/90 p-1.5 shadow-[0_20px_50px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl lg:hidden"
      >
        <div className="grid grid-cols-5 gap-1">
          {MOBILE_TABS.map((item) => {
            const active = location.pathname.startsWith(item.to)
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors',
                  active ? 'bg-veil/10 text-mist-50' : 'text-mist-500 hover:text-mist-200',
                )}
              >
                <Icon className="size-4" />
                <span className="max-w-full truncate text-[9px] font-semibold tracking-[0.04em] uppercase">{item.label}</span>
              </NavLink>
            )
          })}
          <NavLink
            to="/stream"
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors',
                isActive || isLive ? 'bg-live/15 text-live' : 'text-mist-500 hover:text-mist-200',
              )
            }
          >
            <PlayCircle className="size-4" />
            <span className="max-w-full truncate text-[9px] font-semibold tracking-[0.04em] uppercase">Live</span>
          </NavLink>
        </div>
      </nav>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
