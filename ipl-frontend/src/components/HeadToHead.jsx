import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHeadToHead, fetchTeams } from '../services/api';
import { HeadToHeadChart } from './Charts';
import { Swords, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { getTeamData } from '../utils/teamData';
import TeamLogo from './TeamLogo';

const HeadToHead = () => {
    const [teams, setTeams] = useState([]);
    const [team1, setTeam1] = useState('');
    const [team2, setTeam2] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTeams().then(setTeams).catch(console.error);
    }, []);

    const handleSearch = async () => {
        if (!team1 || !team2 || team1 === team2) return;
        setLoading(true);
        setError(null);
        setData(null);
        try {
            const result = await fetchHeadToHead(team1, team2);
            setData(result);
        } catch (err) {
            setError('Could not fetch head-to-head data.');
        } finally {
            setLoading(false);
        }
    };

    const swap = () => {
        setTeam1(team2);
        setTeam2(team1);
        setData(null);
    };

    const t1Info = getTeamData(team1);
    const t2Info = getTeamData(team2);

    const StatPill = ({ label, value, highlight }) => (
        <div className={`text-center p-4 rounded-2xl border ${highlight ? 'border-yellow-400/30 bg-yellow-400/5' : 'border-slate-800 bg-slate-900/50'}`}>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{label}</p>
        </div>
    );

    return (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-400/10 rounded-xl">
                    <Swords size={20} className="text-yellow-400" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-white uppercase italic">Head to Head</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">All-time rivalry stats</p>
                </div>
            </div>

            {/* Team selectors */}
            <div className="flex items-center gap-3 mb-4">
                <select
                    value={team1}
                    onChange={e => { setTeam1(e.target.value); setData(null); }}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:border-yellow-400/50 outline-none text-xs font-bold uppercase italic"
                >
                    <option value="">Team A</option>
                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <button
                    onClick={swap}
                    className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-yellow-400 hover:border-yellow-400/30 transition-all"
                    title="Swap teams"
                >
                    <ArrowLeftRight size={16} />
                </button>

                <select
                    value={team2}
                    onChange={e => { setTeam2(e.target.value); setData(null); }}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white p-3 rounded-xl focus:border-yellow-400/50 outline-none text-xs font-bold uppercase italic"
                >
                    <option value="">Team B</option>
                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <button
                onClick={handleSearch}
                disabled={loading || !team1 || !team2 || team1 === team2}
                className="w-full py-3 rounded-xl bg-yellow-400 text-black font-black text-xs uppercase tracking-widest hover:bg-yellow-300 disabled:bg-slate-800 disabled:text-slate-600 transition-all flex items-center justify-center gap-2"
            >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Swords size={14} />}
                {loading ? 'Calculating...' : 'Compare Teams'}
            </button>

            {/* Results */}
            <AnimatePresence>
                {data && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-6"
                    >
                        {/* Team banners */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-center">
                                <TeamLogo teamName={team1} size="lg" />
                                <p className="text-xs font-black text-white uppercase italic mt-2 leading-tight">{team1}</p>
                                <p className="text-3xl font-black mt-2" style={{ color: t1Info.color || '#eab308' }}>
                                    {data.team1Wins}
                                </p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Wins</p>
                                <p className="text-lg font-black text-yellow-400">{data.team1WinPct}%</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-center">
                                <TeamLogo teamName={team2} size="lg" />
                                <p className="text-xs font-black text-white uppercase italic mt-2 leading-tight">{team2}</p>
                                <p className="text-3xl font-black mt-2" style={{ color: t2Info.color || '#3b82f6' }}>
                                    {data.team2Wins}
                                </p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Wins</p>
                                <p className="text-lg font-black text-blue-400">{data.team2WinPct}%</p>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            <StatPill label="Total Matches" value={data.totalMatches} highlight />
                            <StatPill label="No Results" value={data.noResults} />
                            <StatPill label="Closer Team" value={
                                data.team1Wins > data.team2Wins
                                    ? getTeamData(team1)?.abbr
                                    : data.team2Wins > data.team1Wins
                                        ? getTeamData(team2)?.abbr
                                        : 'Tied'
                            } highlight />
                        </div>

                        {/* Chart */}
                        {data.totalMatches > 0 && (
                            <div className="bg-slate-800/30 rounded-2xl p-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Win Comparison</p>
                                <HeadToHeadChart data={data} />
                            </div>
                        )}

                        {data.totalMatches === 0 && (
                            <div className="text-center py-6 text-slate-500 text-sm font-bold italic">
                                No matches found between these teams.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <p className="mt-4 text-center text-red-400 text-xs font-bold">{error}</p>
            )}
        </div>
    );
};

export default HeadToHead;
