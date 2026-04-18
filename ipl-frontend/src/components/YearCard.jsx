import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTeamData, IPL_WINNERS } from '../utils/teamData';

const YearCard = ({ year, winner, totalMatches, index }) => {
    const navigate = useNavigate();
    const team = getTeamData(winner);
    const isCurrentYear = year === new Date().getFullYear();
    const isPending = winner === 'TBD';

    return (
        <motion.div
            key={year}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
            whileHover={{ y: -8, scale: 1.04 }}
            onClick={() => navigate(`/year/${year}`)}
            className="relative cursor-pointer group overflow-hidden rounded-3xl border border-white/5 bg-slate-900 shadow-xl hover:shadow-2xl hover:border-yellow-400/30 transition-all duration-300"
        >
            {/* Gradient overlay */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(ellipse at top left, ${team.color}20, transparent 70%)`
                }}
            />

            {/* Top badge: winner */}
            {!isPending && (
                <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-2 py-1">
                        <Trophy size={10} className="text-yellow-400" />
                        <span className="text-yellow-400 text-[9px] font-black uppercase tracking-wider truncate max-w-[80px]">
                            {team.abbr}
                        </span>
                    </div>
                </div>
            )}

            {isCurrentYear && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-1 text-[9px] font-black text-green-400 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                    </span>
                </div>
            )}

            <div className="p-6 pt-8">
                {/* Big year */}
                <h2 className="text-5xl font-black italic text-white group-hover:text-yellow-400 transition-colors leading-none mb-1">
                    {year}
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
                    IPL Season
                </p>

                {/* Winner section */}
                <div className="mt-auto pt-4 border-t border-white/5">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">
                        {isPending ? 'Ongoing' : 'Champion'}
                    </p>
                    <p className={`text-xs font-black uppercase italic leading-tight ${isPending ? 'text-slate-500 animate-pulse' : 'text-white group-hover:text-yellow-400 transition-colors'}`}>
                        {isPending ? 'Season in Progress' : winner}
                    </p>
                    {totalMatches > 0 && (
                        <p className="text-[9px] text-slate-600 mt-1">{totalMatches} matches</p>
                    )}
                </div>
            </div>

            {/* Bottom glow bar */}
            <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(to right, transparent, ${team.color}, transparent)` }}
            />
        </motion.div>
    );
};

export default YearCard;
