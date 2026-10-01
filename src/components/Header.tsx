import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  Bell,
  BellOff,
  CalendarDays,
  ChevronDown,
  Gauge,
  Grid3x3,
  House,
  ListOrdered,
  Moon,
  Newspaper,
  Play,
  Settings2,
  Sun,
  Timer,
  Trophy,
  User,
} from 'lucide-react'
import { useSession } from '../context/SessionContext'
import { useNotifications } from '../context/NotificationsContext'
import { useTheme } from '../context/ThemeContext'
import { getSessionMeta } from '../data/sessions'
import { countryFlag } from '../lib/format'
import { cn } from '../lib/cn'
import SettingsPanel from './SettingsPanel'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
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
      {
        to: '/highlights',
        label: 'Highlights',
        icon: Play,
        description: 'Official F1 videos',
      },
      {
        to: '/calendar',
        label: 'Calendar',
        icon: CalendarDays,
        description: 'Full season schedule',
      },
      {
        to: '/schedule',
        label: 'Weekend',
        icon: Timer,
        description: 'Session times',
      },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    items: [
      {
        to: '/standings',
        label: 'Standings',
        icon: Trophy,
        description: 'Championship tables',
      },
      {
        to: '/results',
        label: 'Race Result',
        icon: ListOrdered,
        description: 'Finishing order',
      },
      {
        to: '/qualifying',
        label: 'Qualifying',
        icon: Gauge,
        description: 'Q1 / Q2 / Q3',
      },
      {
        to: '/grid',
        label: 'Starting Grid',
        icon: Grid3x3,
        description: 'Grid formation',
      },
    ],
  },
  {
    id: 'info',
    label: 'Info',
    items: [
      {
        to: '/drivers',
        label: 'Drivers',
        icon: User,
        description: 'Grid and profiles',
      },
      {
        to: '/news',
        label: 'News',
        icon: Newspaper,
        description: 'Latest headlines',
      },
    ],
  },
]

/**
 * Mobile tab bar. Icons only, and deliberately short: these are the four
 * destinations a viewer opens most, and everything else lives behind "More".
 */
const MOBILE_TABS: NavItem[] = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/standings', label: 'Standings', icon: Trophy },
  { to: '/results', label: 'Results', icon: ListOrdered },
]

/** The wordmark: skewed speed bars plus a display-weight logotype. */
function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden className="flex flex-col gap-[3px] skew-x-[-18deg]">
        <span className="h-[3px] w-6 rounded-[1px] bg-f1-red" />
        <span className="h-[3px] w-4 rounded-[1px] bg-mist-100" />
        <span className="h-[3px] w-2.5 rounded-[1px] bg-mist-500" />
      </span>
      <span
        className="font-display text-[19px] font-black tracking-[-0.045em] text-mist-50"
        style={{ fontVariationSettings: '"wdth" 112' }}
      >
        F1<span className="text-f1-red">TV</span>
      </span>
    </span>
  )
}

export default function Header() {
  const location = useLocation()
  const { live } = useSession()
  const notifications = useNotifications()
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  /* Denied permissions cannot be re-requested from a page, so clicking the bell
     in that state used to call `test()`, which returns early when permission is
     not granted — a silent no-op. Show what to do instead. */
  const [notificationHint, setNotificationHint] = useState(false)
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (hintTimer.current) clearTimeout(hintTimer.current)
    }
  }, [])

  const flashHint = () => {
    setNotificationHint(true)
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setNotificationHint(false), 4000)
  }
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  /* --- Height of the floating bar -----------------------------------------
     The bar is fixed, so it needs a matching spacer in normal flow or it
     would sit on top of the page content. Measuring it means the spacer
     tracks the live ticker appearing and disappearing instead of relying on
     hard-coded magic numbers. */
  const barRef = useRef<HTMLDivElement>(null)
  const [barHeight, setBarHeight] = useState(76)

  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const measure = () => {
      // +8 leaves a little breathing room between the bar and the content.
      setBarHeight(Math.round(el.getBoundingClientRect().height) + 8)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    measure()
    return () => observer.disconnect()
  }, [])

  /* --- Scroll-aware chrome ------------------------------------------------ */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
  const isLive = Boolean(live)
  const isStream = location.pathname === '/stream'
  const showTicker = isLive && Boolean(live && liveMeta)

  return (
    <>
      {/* ---- Spacer to offset the fixed floating navbar ------------------
          Mobile has no top bar, so a spacer is only needed there while the
          live ticker is on screen. */}
      {showTicker ? (
        <div style={{ height: barHeight }} />
      ) : (
        <div style={{ height: barHeight }} className="hidden lg:block" />
      )}

      <div
        ref={barRef}
        className="pointer-events-none fixed inset-x-0 top-0 z-60 flex flex-col items-center gap-2.5 px-3 pt-3 sm:px-5 sm:pt-4"
      >
        {/* ---- Live ticker: a floating pill that appears only while a
                 session is actually running ---- */}
        {isLive && live && liveMeta && (
          <Link
            to="/stream"
            className="group pointer-events-auto flex h-9 w-full max-w-[min(100%,34rem)] items-center gap-3 overflow-hidden rounded-full border border-line/15 bg-f1-red/85 px-4 text-white shadow-[0_10px_30px_-12px_rgb(225_6_0/0.65)] backdrop-blur-xl transition-transform duration-300 ease-expo hover:scale-[1.01] sm:px-5"
          >
            <span className="relative flex size-1.5 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-white" />
            </span>
            <span className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase">
              {liveMeta.label} Live
            </span>
            <span className="hidden min-w-0 flex-1 truncate text-[11.5px] text-white/85 sm:block">
              {live.location || live.circuit_short_name}
              {live.country_name
                ? ` · ${countryFlag(live.country_name)} ${live.country_name}`
                : ''}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1.5 pl-2 text-[10.5px] font-semibold tracking-[0.06em] uppercase transition-all group-hover:gap-2.5">
              Watch
              <Play size={11} className="fill-current" />
            </span>
          </Link>
        )}

        {/* ---- Floating glass navbar ---- */}
        <header
          className={cn(
            // w-fit hugs the wordmark/nav/actions, so the bar reads as a pill
            // rather than a stretched band; the max is a guardrail for long
            // locale strings and mid-size screens.
            'relative hidden h-14 w-fit max-w-[min(100%,44rem)] items-center gap-3 rounded-full border px-4 transition-all duration-400 ease-expo lg:flex sm:px-5',
            scrolled
              ? 'border-line/12 bg-ink-900/78 shadow-[0_18px_45px_-18px_rgb(0_0_0/0.95),0_2px_10px_-4px_rgb(0_0_0/0.6)] backdrop-blur-2xl backdrop-saturate-150'
              : 'border-line/8 bg-ink-900/52 shadow-[0_14px_38px_-20px_rgb(0_0_0/0.85)] backdrop-blur-xl backdrop-saturate-150',
          )}
        >
          {/* Inner top highlight: the edge that sells the glass. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-line/28 to-transparent"
          />
          <div className="pointer-events-auto flex w-full items-center gap-3">
            <Link
              to="/home"
              className="shrink-0 transition-opacity duration-250 hover:opacity-80"
              aria-label="F1TV home"
            >
              <Wordmark />
            </Link>

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
                        'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold tracking-[0.07em] uppercase transition-colors duration-250',
                        activeItem
                          ? 'text-f1-red'
                          : 'text-mist-300 hover:bg-veil/6 hover:text-mist-50',
                      )}
                    >
                      {group.label}
                      <ChevronDown
                        size={12}
                        className={cn(
                          'transition-transform duration-300 ease-expo',
                          open && 'rotate-180',
                        )}
                      />
                      {activeItem && (
                        <span className="absolute inset-x-2.5 -bottom-px h-px bg-f1-red" />
                      )}
                    </button>

                    {open && (
                      <div
                        className={cn(
                          'animate-slide-down absolute top-full z-50 w-64 pt-3',
                          // The pill hugs its content, so the last group sits
                          // near the right edge: anchor that menu to the right
                          // or it overhangs the bar.
                          groupIndex === NAV.length - 1 ? 'right-0' : 'left-0',
                        )}
                      >
                        {/* Same glass recipe as the pill, so the menu reads as
                            a continuation of it rather than a solid slab. */}
                        <div className="relative rounded-[22px] border border-line/12 bg-ink-900/55 p-1.5 shadow-[0_28px_70px_-24px_rgb(0_0_0/0.95)] backdrop-blur-2xl backdrop-saturate-150">
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-line/25 to-transparent"
                          />
                          {group.items.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-2.5 rounded-full px-2.5 py-1.5 transition-colors duration-200',
                                  isActive
                                    ? 'bg-f1-red/14 text-mist-50'
                                    : 'text-mist-300 hover:bg-veil/8 hover:text-mist-50',
                                )
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <span
                                    className={cn(
                                      'flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
                                      isActive
                                        ? 'bg-f1-red/18 text-f1-red'
                                        : 'bg-veil/6 text-mist-400',
                                    )}
                                  >
                                    <item.icon size={13} />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[12.5px] font-medium">
                                      {item.label}
                                    </span>
                                    {item.description && (
                                      <span className="block truncate text-[10.5px] text-mist-500">
                                        {item.description}
                                      </span>
                                    )}
                                  </span>
                                </>
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

            <div className="ml-auto flex items-center gap-1.5">
              {/* ---- Notification opt-in ---- */}
              {/* `relative` so the blocked hint anchors to the bell, not to
                  the bar. */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (notifications.enabled) {
                      notifications.disable()
                    } else if (notifications.state === 'denied') {
                      // Browser will not prompt again; sending `test()` here was a
                      // no-op. Explain how to undo the block.
                      flashHint()
                    } else {
                      void notifications.enable()
                    }
                  }}
                  aria-describedby={notificationHint ? 'notifications-blocked-hint' : undefined}
                  disabled={notifications.state === 'unsupported'}
                  title={
                    notifications.state === 'unsupported'
                      ? 'Not supported in this browser'
                      : notifications.enabled
                        ? 'Session alerts on — click to turn off'
                        : notifications.state === 'denied'
                          ? 'Alerts blocked in browser settings'
                          : 'Get an alert before each session'
                  }
                  aria-label={
                    notifications.enabled
                      ? 'Disable session alerts'
                      : notifications.state === 'denied'
                        ? 'Session alerts blocked — show how to allow them'
                        : 'Enable session alerts'
                  }
                  className={cn(
                    'rounded-sm p-2 transition-colors duration-250',
                    notifications.enabled
                      ? 'text-turf hover:bg-veil/6'
                      : notifications.state === 'denied'
                        ? 'text-mist-500/50 hover:bg-veil/6'
                        : 'text-mist-400 hover:bg-veil/6 hover:text-mist-100',
                  )}
                >
                  {notifications.enabled ? (
                    <Bell size={15} />
                  ) : notifications.state === 'denied' ? (
                    <BellOff size={15} />
                  ) : (
                    <Bell size={15} />
                  )}
                </button>

                {notificationHint && (
                  <span
                    id="notifications-blocked-hint"
                    role="status"
                    className="animate-slide-down pointer-events-none absolute top-full right-0 z-50 mt-2 w-60 rounded-xs border border-line/12 bg-ink-900/95 px-3 py-2.5 text-[11.5px] leading-relaxed text-mist-200 shadow-lift backdrop-blur-xl"
                  >
                    Alerts are blocked for this site. Re-allow them in your browser's
                    site settings, then reload.
                  </span>
                )}
              </div>

              {/* ---- Theme toggle ----
                  One tap flips the theme. The full settings dialog (which also
                  carries the time-zone choice) sits behind the adjacent gear, so
                  the common action does not cost an extra click. */}
              <button
                type="button"
                onClick={toggle}
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                className="rounded-sm p-2 text-mist-400 transition-colors duration-250 hover:bg-veil/6 hover:text-mist-100"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Display settings"
                aria-label="Display settings"
                className="rounded-sm p-2 text-mist-400 transition-colors duration-250 hover:bg-veil/6 hover:text-mist-100"
              >
                <Settings2 size={15} />
              </button>

              {/* ---- Watch live CTA ---- */}
              <Link
                to="/stream"
                className={cn(
                  'group relative flex h-9 items-center gap-2 overflow-hidden rounded-sm px-3.5 text-[11px] font-semibold tracking-[0.07em] uppercase transition-all duration-300 ease-expo',
                  isStream || isLive
                    ? 'bg-live text-white shadow-[0_6px_24px_-8px_rgb(255_59_48/0.7)]'
                    : 'bg-linear-to-br from-f1-red to-f1-red-deep text-white shadow-red hover:-translate-y-0.5 hover:from-f1-red-bright',
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-line/25 to-transparent transition-transform duration-700 ease-swift group-hover:translate-x-full"
                />
                <Play size={11} className="relative fill-current" />
                <span className="relative">{isLive ? 'Watch now' : 'Watch live'}</span>
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* ---- Mobile tab bar -----------------------------------------------
          Pinned to the bottom so every target sits inside thumb reach, and
          icon-only to keep the row short enough to spread comfortably. It
          takes over from the top pill below the lg breakpoint. */}
      <nav
        aria-label="Primary"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex justify-center px-5 pb-[max(1.75rem,calc(env(safe-area-inset-bottom)+1rem))] lg:hidden"
      >
        <div
          className={cn(
            // w-fit + justify-center makes the pill hug the icons and hover
            // clear of every screen edge. Spacing comes from an even `gap`
            // rather than justify-around: distributing free space put ~8px at
            // the ends and ~18px between items, which read as misaligned.
            // The deep, wide shadow is what sells "floating" — it reads as a
            // cast shadow on the page rather than a bar stuck to the edge.
            // No border and no ring: the edge is defined purely by the glass
            // and the cast shadow, so nothing reads as an outline.
            'pointer-events-auto relative flex h-16 w-fit max-w-[min(100%,24rem)] items-center gap-0.5 rounded-full px-2 backdrop-blur-2xl backdrop-saturate-150',
            scrolled
              ? 'bg-ink-900/84 shadow-[0_22px_55px_-16px_rgb(0_0_0/0.95),0_6px_16px_-6px_rgb(0_0_0/0.6)]'
              : 'bg-ink-900/66 shadow-[0_18px_46px_-18px_rgb(0_0_0/0.9),0_4px_12px_-6px_rgb(0_0_0/0.5)]',
          )}
        >
          {/* Inner bottom highlight, mirroring the top pill's top edge. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-12 bottom-0 h-px bg-linear-to-r from-transparent via-line/8 to-transparent"
          />

          {MOBILE_TABS.map((item) => {
            const active = location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-full transition-colors duration-250',
                  active
                    ? 'bg-f1-red/14 text-f1-red'
                    : 'text-mist-400 hover:bg-veil/6 hover:text-mist-100',
                )}
              >
                <item.icon
                  size={19}
                  className={cn(active && 'drop-shadow-[0_0_8px_rgb(225_6_0/0.45)]')}
                />
              </NavLink>
            )
          })}

          {/* Live is the one destination worth surfacing on every screen. */}
          <NavLink
            to="/stream"
            aria-label="Watch live"
            title="Watch live"
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-full transition-colors duration-250',
              isStream || isLive
                ? 'bg-live text-white'
                : 'bg-linear-to-br from-f1-red to-f1-red-deep text-white',
            )}
          >
            <Play size={17} className="fill-current" />
          </NavLink>

          {/* ---- Theme toggle ----
              The top pill is hidden below `lg`, so without this the theme is
              unreachable on a phone: settings live behind the gear, which is
              itself only in the top bar. Same `toggle` and the same
              Sun/Moon pairing as the desktop control, at the bar's icon size
              so the two read as one control. Sits last and is separated by a
              hairline divider because it is a preference, not a destination
              — it should not read as a fifth tab. */}
          <span aria-hidden className="mx-0.5 h-7 w-px shrink-0 bg-line/15" />
          <button
            type="button"
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-mist-400 transition-colors duration-250 hover:bg-veil/6 hover:text-mist-100"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </nav>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}
