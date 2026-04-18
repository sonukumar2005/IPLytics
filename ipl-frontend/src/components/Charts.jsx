import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import { getTeamData } from '../utils/teamData';

// ── Team Performance (Wins vs Losses) ────────────────────────────────────────
export const TeamPerformanceChart = ({ data }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.map(d => ({
        name: getTeamData(d.teamName)?.abbr || d.teamName?.substring(0, 3).toUpperCase(),
        wins: d.wins,
        losses: d.losses ?? (d.matchesPlayed - d.wins),
        full: d.teamName,
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const full = chartData.find(d => d.name === label)?.full || label;
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
                <p className="font-black text-white uppercase mb-1">{full}</p>
                {payload.map(p => (
                    <p key={p.name} style={{ color: p.fill }}>
                        {p.name === 'wins' ? '✅ Wins' : '❌ Losses'}: {p.value}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="wins" name="wins" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="losses" name="losses" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

// ── Head to Head Chart ────────────────────────────────────────────────────────
export const HeadToHeadChart = ({ data }) => {
    if (!data) return null;

    const chartData = [
        { name: data.team1, wins: data.team1Wins, color: '#eab308' },
        { name: data.team2, wins: data.team2Wins, color: '#3b82f6' },
        { name: 'No Result', wins: data.noResults, color: '#475569' },
    ].filter(d => d.wins >= 0);

    const t1 = getTeamData(data.team1);
    const t2 = getTeamData(data.team2);
    const colors = [t1.color || '#eab308', t2.color || '#3b82f6', '#475569'];

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
                <p className="font-black text-white uppercase mb-1">{payload[0].payload.name}</p>
                <p style={{ color: payload[0].payload.color }}>Wins: {payload[0].value}</p>
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="wins" radius={[0, 8, 8, 0]} maxBarSize={32}>
                    {chartData.map((entry, index) => (
                        <Cell key={index} fill={colors[index]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

// ── Win Rate Donut (single team stat) ────────────────────────────────────────
export const WinRateBar = ({ wins, total, teamName, color }) => {
    const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
    const team = getTeamData(teamName);
    const barColor = color || team.color || '#eab308';

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-black text-slate-400 uppercase">{teamName}</span>
                <span className="text-xs font-black" style={{ color: barColor }}>{pct}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: barColor }}
                />
            </div>
            <p className="text-[10px] text-slate-600 mt-1">{wins} wins / {total} matches</p>
        </div>
    );
};
