import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import YearSelection from './pages/YearSelection';
import PointsTable from './pages/PointsTable';
import TeamMatches from './pages/TeamMatches';
import MatchDetails from './pages/MatchDetails';
import MatchPredictor from './pages/MatchPredictor';
import VenuesPage from './pages/VenuesPage';
import { Home, BrainCircuit, MapPin, BarChart3 } from 'lucide-react';
import LiveMatches from "./pages/LiveMatches";

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-yellow-400 selection:text-black">

                {/* ── Ambient Background Glow ── */}
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] bg-yellow-900/8 blur-[140px] rounded-full" />
                    <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-blue-900/8 blur-[140px] rounded-full" />
                    <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-purple-900/5 blur-[120px] rounded-full" />
                </div>

                {/* ── Navigation Bar ── */}
                <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl py-4">
                    <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-black font-black text-xs group-hover:rotate-12 transition-transform duration-300">
                                IPL
                            </div>
                            <span className="text-lg font-black uppercase italic tracking-tight hidden md:block">
                                Analytics <span className="text-yellow-400">Dashboard</span>
                            </span>
                        </Link>

                        {/* Nav links */}
                        <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-2xl border border-white/5">
                            <NavLink to="/" icon={<Home size={15} />} label="Home" exact />
                            <NavLink to="/predict" icon={<BrainCircuit size={15} />} label="AI Predictor" />
                            <NavLink to="/venues" icon={<MapPin size={15} />} label="Venues" />
                            <NavLink to="/live" label="Live" />
                        </div>
                    </div>
                </nav>

                {/* ── Page Content ── */}
                <main className="pb-20">
                    <Routes>
                        <Route path="/" element={<YearSelection />} />
                        <Route path="/year/:year" element={<PointsTable />} />
                        <Route path="/team/:team/:year" element={<TeamMatches />} />
                        <Route path="/match/:id" element={<MatchDetails />} />
                        <Route path="/predict" element={<MatchPredictor />} />
                        <Route path="/venues" element={<VenuesPage />} />
                        <Route path="/live" element={<LiveMatches />} />
                    </Routes>
                </main>

                {/* ── Footer ── */}
                <footer className="border-t border-white/5 bg-slate-950/60 py-6 text-center">
                    <p className="text-slate-600 text-xs font-black uppercase tracking-widest">
                        IPL Analytics Dashboard · Data sourced from historical CSV + Cricbuzz API fallback
                    </p>
                </footer>
            </div>
        </Router>
    );
}

const NavLink = ({ to, icon, label, exact }) => {
    const location = useLocation();
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                isActive
                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
};

export default App;
