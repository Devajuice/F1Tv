import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ImmersiveLayout, Layout } from './components/Layout';
import BackToTop from './components/BackToTop';
import { SessionProvider } from './context/SessionContext';
import { NotificationsProvider } from './context/NotificationsContext';
import RouteFallback from './components/RouteFallback';

/* Route-level code splitting: the initial bundle no longer carries the
   player, the tables and the video grid. */
const Home = lazy(() => import('./pages/Home'));
const Stream = lazy(() => import('./pages/Stream'));
const Standings = lazy(() => import('./pages/Standings'));
const RaceCalendar = lazy(() => import('./pages/RaceCalendar'));
const RaceResults = lazy(() => import('./pages/RaceResults'));
const QualifyingResults = lazy(() => import('./pages/QualifyingResults'));
const GridLineup = lazy(() => import('./pages/GridLineup'));
const PracticeSchedule = lazy(() => import('./pages/PracticeSchedule'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Highlights = lazy(() => import('./pages/Highlights'));
const News = lazy(() => import('./pages/News'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Routes that opt out of the header/footer shell. */
const IMMERSIVE = new Set(['/stream']);

/** Reset scroll on navigation, but leave in-page anchors alone. */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}

function AppRoutes() {
  const location = useLocation();
  const immersive = IMMERSIVE.has(location.pathname);
  const Shell = immersive ? ImmersiveLayout : Layout;

  return (
    <>
      <ScrollManager />
      <AnimatePresence mode="wait" initial={false}>
        <Shell key={location.pathname}>
          <Suspense fallback={<RouteFallback immersive={immersive} />}>
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/stream" element={<Stream />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/calendar" element={<RaceCalendar />} />
              <Route path="/results" element={<RaceResults />} />
              <Route path="/qualifying" element={<QualifyingResults />} />
              <Route path="/grid" element={<GridLineup />} />
              <Route path="/schedule" element={<PracticeSchedule />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/highlights" element={<Highlights />} />
              <Route path="/news" element={<News />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Shell>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <NotificationsProvider>
          <AppRoutes />
          <BackToTop />
        </NotificationsProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
