import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { fetchLeagueStats } from '../services/api';
import { BarChart3 } from 'lucide-react';

const LeagueStatsChart = ({ year }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetchLeagueStats(year).then(setData).catch(console.error);
    }, [year]);

    return (
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl h-full">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400">
                    <BarChart3 size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black uppercase italic text-white leading-tight">Seasonal <span className="text-yellow-400 block sm:inline">Win Variance</span></h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Team Performance Distribution for {year}</p>
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis 
                            dataKey="label" 
                            angle={-45} 
                            textAnchor="end" 
                            interval={0} 
                            fontSize={10} 
                            fontWeight="bold" 
                            stroke="#475569" 
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis 
                            fontSize={12} 
                            fontWeight="bold" 
                            stroke="#475569" 
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#020617', 
                                border: '1px solid #1e293b', 
                                borderRadius: '1rem',
                                color: '#fff',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}
                            itemStyle={{ color: '#eab308' }}
                            cursor={{ fill: '#1e293b50' }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 4, 4]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default LeagueStatsChart;
