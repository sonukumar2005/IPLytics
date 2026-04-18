import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchPointsTable, fetchLeagueStats } from '../services/api';
import { IPL_WINNERS } from '../utils/teamData';
import { ArrowLeft, Trophy, TrendingUp, BarChart3 } from 'lucide-react';
import TeamLogo from '../components/TeamLogo';
import { TeamPerformanceChart } from '../components/Charts';

const PointsTable = () => {
    const { year } = useParams();
    const navigate = useNavigate();
    const [tableData, setTableData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart'

    useEffect(() => {
        Promise.all([
            fetchPointsTable(year),
            fetchLeagueStats(year).catch(() => []),
        ]).then(([table, stats]) => {
            setTableData(table);
            // Build chart data from table (wins + losses)
            setChartData(table.map(t => ({
                teamName: t.teamName,
                wins: t.wins,
                losses: t.losses,
                matchesPlayed: t.matchesPlayed,
            })));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [year]);

    const champion = IPL_WINNERS[parseInt(year)];

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-4">
                <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Loading Standings...</p>
            </div>
        );
    }

    if (!tableData || tableData.length === 0) {
        return (
            <div className="max-w-3xl mx-auto px-6 py-20 text-center">
                <p className="text-slate-500 text-xl font-bold italic mb-4">No data available for IPL {year}</p>
                <button onClick={() => navigate('/')} className="text-yellow-400 text-sm font-black uppercase hover:underline">
                    ← Back to Seasons
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            {/* Back */}
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 mb-8 transition-colors text-xs font-black uppercase tracking-widest"
            >
                <ArrowLeft size={16} /> Back to Seasons
            </button>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4"
            >
                <div>
                    <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-2">IPL {year}</p>
                    <h1 className="text-5xl md:text-6xl font-black text-white italic leading-none">
                        SEASON <span className="text-yellow-400">STANDINGS</span>
                    </h1>
                    {champion && champion !== 'TBD' && (
                        <div className="flex items-center gap-2 mt-3">
                            <Trophy size={14} className="text-yellow-400" />
                            <span className="text-slate-400 text-xs font-bold uppercase">Champion: </span>
                            <span className="text-yellow-400 text-xs font-black uppercase">{champion}</span>
                        </div>
                    )}
                </div>

                {/* View toggle */}
                <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                            viewMode === 'table' ? 'bg-yellow-400 text-black' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <TrendingUp size={14} /> Table
                    </button>
                    <button
                        onClick={() => setViewMode('chart')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                            viewMode === 'chart' ? 'bg-yellow-400 text-black' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <BarChart3 size={14} /> Chart
                    </button>
                </div>
            </motion.div>

            {viewMode === 'table' ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-10"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">Team</th>
                                    <th className="px-4 py-4 text-center">P</th>
                                    <th className="px-4 py-4 text-center">W</th>
                                    <th className="px-4 py-4 text-center">L</th>
                                    <th className="px-4 py-4 text-center">NRR</th>
                                    <th className="px-4 py-4 text-center">Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((row, index) => {
                                    const isTopFour = index < 4;
                                    const isChampion = row.teamName === champion;
                                    return (
                                        <motion.tr
                                            key={row.teamName}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => navigate(`/team/${encodeURIComponent(row.teamName)}/${year}`)}
                                            className={`border-b border-slate-800/50 cursor-pointer transition-all group hover:bg-slate-800/40 ${
                                                isChampion ? 'bg-yellow-400/5' : ''
                                            }`}
                                        >
                                            {/* Position */}
                                            <td className="px-6 py-4">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                                    isChampion
                                                        ? 'bg-yellow-400 text-black'
                                                        : isTopFour
                                                        ? 'bg-slate-700 text-yellow-400'
                                                        : 'text-slate-600'
                                                }`}>
                                                    {isChampion ? <Trophy size={12} /> : index + 1}
                                                </div>
                                            </td>

                                            {/* Team */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <TeamLogo teamName={row.teamName} size="sm" />
                                                    <div>
                                                        <span className="font-black text-white group-hover:text-yellow-400 transition-colors text-sm uppercase italic">
                                                            {row.teamName}
                                                        </span>
                                                        {isTopFour && !isChampion && (
                                                            <p className="text-[9px] text-green-500 font-black uppercase">Playoff</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-center text-slate-300 font-bold text-sm">{row.matchesPlayed}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-green-400 font-black text-sm">{row.wins}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="text-red-400 font-bold text-sm">{row.losses}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center text-slate-400 font-mono text-sm">
                                                {row.netRunRate > 0 ? '+' : ''}{row.netRunRate?.toFixed(3)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                                                    isTopFour
                                                        ? 'bg-yellow-400 text-black'
                                                        : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {row.points}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Playoff qualification notice */}
                    <div className="px-6 py-3 border-t border-slate-800 flex items-center gap-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-sm bg-yellow-400" />
                            Playoff Qualified (Top 4)
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-10"
                >
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
                        Wins vs Losses — IPL {year}
                    </h3>
                    <TeamPerformanceChart data={chartData} />
                    <div className="flex items-center gap-6 mt-4 justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-green-500" />
                            <span className="text-xs text-slate-400 font-bold">Wins</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-red-500" />
                            <span className="text-xs text-slate-400 font-bold">Losses</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default PointsTable;