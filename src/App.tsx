import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import Stream from './pages/Stream';
import Standings from './pages/Standings';
import Highlights from './pages/Highlights';
import RaceCalendar from './pages/RaceCalendar';
import RaceResults from './pages/RaceResults';
import News from './pages/News';
import QualifyingResults from './pages/QualifyingResults';
import GridLineup from './pages/GridLineup';
import PracticeSchedule from './pages/PracticeSchedule';
import Drivers from './pages/Drivers';
import NotFound from './pages/NotFound';
import BackToTop from './components/BackToTop';
import useSessionNotifications from './hooks/useSessionNotifications';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/stream" element={<Stream />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/highlights" element={<Highlights />} />
        <Route path="/calendar" element={<RaceCalendar />} />
        <Route path="/results" element={<RaceResults />} />
        <Route path="/news" element={<News />} />
        <Route path="/qualifying" element={<QualifyingResults />} />
        <Route path="/grid" element={<GridLineup />} />
        <Route path="/schedule" element={<PracticeSchedule />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useSessionNotifications();
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <BackToTop />
    </BrowserRouter>
  );
}

export default App;
