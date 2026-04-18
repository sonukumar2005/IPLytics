import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchSeasons, fetchYears } from '../services/api';
import { IPL_WINNERS } from '../utils/teamData';
import { Trophy, Zap, Filter } from 'lucide-react';
import YearCard from '../components/YearCard';

const YearSelection = () => {
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        // Try rich season data first, fallback to plain years
        fetchSeasons()
            .then(data => {
                setSeasons(data);
                setLoading(false);
            })
            .catch(() => {
                fetchYears()
                    .then(years => {
                        const mapped = years.map(y => ({
                            year: y,
                            winner: IPL_WINNERS[y] || 'TBD',
                            totalMatches: 0,
                            logo: '',
                        }));
                        setSeasons(mapped);
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
            });
    }, []);

    const filtered = seasons.filter(s => {
        if (filter === 'csk') return s.winner === 'Chennai Super Kings';
        if (filter === 'mi') return s.winner === 'Mumbai Indians';
        if (filter === 'kkr') return s.winner === 'Kolkata Knight Riders';
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-4">
                <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest animate-pulse">
                    Loading IPL Archives...
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">

            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-2 mb-6">
                    <Zap size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">IPL Analytics Dashboard</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white italic leading-none mb-4">
                    SELECT A <span className="text-yellow-400">SEASON</span>
                </h1>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                    Explore {seasons.length} seasons of Indian Premier League history
                </p>
            </motion.div>

            {/* Quick filter pills */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2 mb-8 justify-center"
            >
                {[
                    { key: 'all', label: 'All Seasons' },
                    { key: 'mi', label: '🔵 MI Titles' },
                    { key: 'csk', label: '🟡 CSK Titles' },
                    { key: 'kkr', label: '💜 KKR Titles' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                            filter === f.key
                                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-900/30'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </motion.div>

            {/* Season Grid */}
            {filtered.length === 0 ? (
                <div className="text-center text-slate-500 py-20 font-bold italic">No seasons match this filter.</div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filtered.map((season, index) => (
                        <YearCard
                            key={season.year}
                            year={season.year}
                            winner={season.winner || IPL_WINNERS[season.year] || 'TBD'}
                            totalMatches={season.totalMatches}
                            index={index}
                        />
                    ))}
                </div>
            )}

            {/* Footer stat */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 text-center"
            >
                <div className="inline-flex items-center gap-6 bg-slate-900 border border-slate-800 rounded-2xl px-8 py-4">
                    <div className="text-center">
                        <p className="text-2xl font-black text-yellow-400">{seasons.length}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Seasons</p>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div className="text-center">
                        <p className="text-2xl font-black text-white">5</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Unique Champions</p>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div className="text-center">
                        <p className="text-2xl font-black text-yellow-400">
                            <Trophy size={24} className="inline" />
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Most Titles: MI/CSK</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default YearSelection;