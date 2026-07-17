import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Stream from './pages/Stream';
import Standings from './pages/Standings';
import Highlights from './pages/Highlights';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/stream" element={<Stream />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/highlights" element={<Highlights />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
