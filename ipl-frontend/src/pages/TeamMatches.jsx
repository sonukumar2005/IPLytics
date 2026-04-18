import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchTeamMatches } from '../services/api';
import { getTeamData } from '../utils/teamData';
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import TeamLogo from '../components/TeamLogo';
import MatchCard from '../components/MatchCard';

const TeamMatches = () => {
    const { team, year } = useParams();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const decodedTeam = decodeURIComponent(team);
    const teamInfo = getTeamData(decodedTeam);

    useEffect(() => {
        fetchTeamMatches(decodedTeam, year)
            .then(data => { setMatches(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [decodedTeam, year]);

    const wins = matches.filter(m => m.result === 'Win').length;
    const losses = matches.filter(m => m.result === 'Loss').length;
    const ties = matches.filter(m => m.result === 'Tie').length;
    const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

    const filtered = filter === 'all' ? matches
        : matches.filter(m => m.result === filter);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-4">
                <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Loading match history...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            {/* Back */}
            <button
                onClick={() => navigate(`/year/${year}`)}
                className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 mb-8 transition-colors text-xs font-black uppercase tracking-widest"
            >
                <ArrowLeft size={16} /> Back to {year} Season
            </button>

            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="flex items-center gap-5 mb-6">
                    <div className="p-3 rounded-2xl border border-white/10" style={{ background: `${teamInfo.color}22` }}>
                        <TeamLogo teamName={decodedTeam} size="xl" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">IPL {year}</p>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic leading-none">
                            {decodedTeam}
                        </h1>
                        <p className="text-yellow-400 font-black text-sm uppercase tracking-widest mt-1">
                            {year} Campaign
                        </p>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Played', value: matches.length, color: 'text-white', icon: null },
                        { label: 'Wins', value: wins, color: 'text-green-400', icon: <CheckCircle2 size={16} className="text-green-400" /> },
                        { label: 'Losses', value: losses, color: 'text-red-400', icon: <XCircle size={16} className="text-red-400" /> },
                        { label: 'Win Rate', value: `${winRate}%`, color: 'text-yellow-400', icon: null },
                    ].map(stat => (
                        <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                {stat.icon}
                                <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Win rate bar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">
                        <span>Win Rate</span>
                        <span className="text-yellow-400">{winRate}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${winRate}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(to right, ${teamInfo.color || '#eab308'}, #eab308)` }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Filter pills */}
            <div className="flex gap-2 mb-6">
                {[
                    { key: 'all', label: 'All Matches' },
                    { key: 'Win', label: '✅ Wins' },
                    { key: 'Loss', label: '❌ Losses' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                            filter === f.key
                                ? 'bg-yellow-400 text-black'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Matches grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-600 font-bold italic">No matches found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((match, i) => (
                        <MatchCard key={match.matchId} match={match} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamMatches;
