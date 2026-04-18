import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, CheckCircle2, XCircle, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TeamLogo from './TeamLogo';

const MatchCard = ({ match, teamName, index = 0 }) => {
    const navigate = useNavigate();

    const isWin = match.result === 'Win';
    const isLoss = match.result === 'Loss';

    const borderColor = isWin
        ? 'border-green-700/40 hover:border-green-500/60'
        : isLoss
        ? 'border-red-900/30 hover:border-red-700/40'
        : 'border-slate-800 hover:border-slate-600';

    const bgColor = isWin
        ? 'bg-green-950/30'
        : isLoss
        ? 'bg-red-950/20'
        : 'bg-slate-900';

    const ResultIcon = isWin ? CheckCircle2 : isLoss ? XCircle : Minus;
    const resultColor = isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-slate-400';
    const badgeBg = isWin
        ? 'bg-green-500 text-black'
        : isLoss
        ? 'bg-red-500/80 text-white'
        : 'bg-slate-700 text-slate-300';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => navigate(`/match/${match.matchId}`)}
            className={`relative p-6 rounded-2xl cursor-pointer border overflow-hidden group transition-all duration-300 ${bgColor} ${borderColor}`}
        >
            {/* Result icon */}
            <div className={`absolute top-4 right-4 ${resultColor}`}>
                <ResultIcon size={20} />
            </div>

            {/* 🔥 TEAM VS (LOGO + NAME) */}
            <div className="flex items-center gap-4 mb-4 pr-8">
                <TeamLogo teamName={teamName} size="sm" />
                <span className="text-xs text-slate-500 font-bold">VS</span>
                <TeamLogo teamName={match.opponent} size="sm" />
            </div>

            {/* Meta info */}
            <div className="space-y-2 mb-4">
                {match.date && (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={13} className="text-yellow-400/70" />
                        <span className="text-xs">{match.date}</span>
                    </div>
                )}
                {match.venue && (
                    <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={13} className="text-yellow-400/70" />
                        <span className="text-xs truncate">{match.venue}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                {match.playerOfMatch && (
                    <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                            Man of Match
                        </p>
                        <p className="text-xs font-bold text-white italic">
                            {match.playerOfMatch}
                        </p>
                    </div>
                )}

                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${badgeBg}`}>
                    {match.result}
                </span>
            </div>
        </motion.div>
    );
};

export default MatchCard;