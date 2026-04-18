import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMatchDetails } from '../services/api';
import { getTeamData } from '../utils/teamData';
import {
    ArrowLeft, Award, MapPin, Calendar, User,
    Shield, Trophy, Zap
} from 'lucide-react';
import TeamLogo from '../components/TeamLogo';

const MatchDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        fetchMatchDetails(id)
            .then(data => { setMatch(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-screen gap-4">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Decoding Match Scorecard...</p>
        </div>
    );

    if (!match) return (
        <div className="text-center py-20">
            <p className="text-red-400 font-bold mb-4">Match data not found.</p>
            <button onClick={() => navigate(-1)} className="text-yellow-400 text-xs font-black uppercase hover:underline">
                ← Go Back
            </button>
        </div>
    );

    const t1Info = getTeamData(match.team1);
    const t2Info = getTeamData(match.team2);
    const winnerInfo = getTeamData(match.matchWinner);

    const tabs = [
        { id: 'summary', label: 'Summary', icon: <Shield size={15} /> },
        { id: 'scorecard', label: 'Scorecard', icon: <Trophy size={15} /> },
        { id: 'toss', label: 'Toss & Venue', icon: <Zap size={15} /> },
    ];

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 mb-8 transition-colors text-xs font-black uppercase tracking-widest group"
            >
                <div className="w-7 h-7 rounded-full border border-slate-800 flex items-center justify-center group-hover:border-yellow-400/50 transition-colors">
                    <ArrowLeft size={14} />
                </div>
                Return to Matches
            </button>

            {/* Hero matchup card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden mb-8"
            >
                {/* Background gradient */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: `linear-gradient(135deg, ${t1Info.color}40 0%, transparent 50%, ${t2Info.color}40 100%)`
                    }}
                />

                <div className="relative p-10">
                    {/* Match ID badge */}
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                            Match #{id}
                        </span>
                    </div>

                    {/* Teams */}
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex flex-col items-center flex-1">
                            <div
                                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl p-4 mb-4 border border-white/10 flex items-center justify-center"
                                style={{ background: `${t1Info.color}22` }}
                            >
                                <TeamLogo teamName={match.team1} size="xl" />
                            </div>
                            <h2 className="text-base md:text-lg font-black uppercase italic text-center leading-tight text-white">
                                {match.team1}
                            </h2>
                            {match.matchWinner === match.team1 && (
                                <span className="mt-2 text-[9px] font-black text-black bg-yellow-400 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                    <Trophy size={9} /> Winner
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black italic text-yellow-400">VS</span>
                            {match.resultMargin && (
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 text-center">
                                    Won by<br />{match.resultMargin}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col items-center flex-1">
                            <div
                                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl p-4 mb-4 border border-white/10 flex items-center justify-center"
                                style={{ background: `${t2Info.color}22` }}
                            >
                                <TeamLogo teamName={match.team2} size="xl" />
                            </div>
                            <h2 className="text-base md:text-lg font-black uppercase italic text-center leading-tight text-white">
                                {match.team2}
                            </h2>
                            {match.matchWinner === match.team2 && (
                                <span className="mt-2 text-[9px] font-black text-black bg-yellow-400 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                    <Trophy size={9} /> Winner
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Info pills row */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
            >
                <InfoCard icon={<Calendar size={16} />} label="Date" value={match.date || 'N/A'} />
                <InfoCard icon={<MapPin size={16} />} label="Venue" value={match.venue} />
                <InfoCard icon={<Award size={16} />} label="Player of Match" value={match.playerOfMatch} highlight />
                <InfoCard icon={<User size={16} />} label="Toss" value={`${match.tossWinner} — ${match.tossDecision}`} />
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                            activeTab === tab.id
                                ? 'bg-yellow-400 text-black shadow-lg'
                                : 'text-slate-500 hover:text-white'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-8 min-h-[200px]"
                >
                    {activeTab === 'summary' && (
                        <div>
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                    style={{ background: `${winnerInfo.color}22` }}
                                >
                                    <Trophy size={28} className="text-yellow-400" />
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Match Winner</p>
                                <h2 className="text-4xl font-black uppercase italic text-yellow-400 mb-2">{match.matchWinner}</h2>
                                {match.resultMargin && (
                                    <p className="text-slate-400 font-bold uppercase text-sm">Won by {match.resultMargin}</p>
                                )}
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Man of the Match</p>
                                    <p className="text-yellow-400 font-black text-sm italic">{match.playerOfMatch || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-800/50 rounded-2xl p-4 text-center">
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Match #</p>
                                    <p className="text-white font-black text-sm">{id}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'scorecard' && (
                        <div className="py-8 text-center">
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Trophy size={20} className="text-slate-600" />
                            </div>
                            <p className="text-slate-500 font-bold text-sm italic mb-2">
                                Ball-by-ball scorecard data requires live API integration.
                            </p>
                            <p className="text-slate-600 text-xs font-bold">
                                Connect to Cricbuzz API (RapidAPI) for full scorecard.
                            </p>
                            <div className="mt-6 bg-slate-800/40 rounded-2xl p-5 text-left max-w-sm mx-auto">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Match Summary</p>
                                <div className="space-y-2 text-xs font-bold">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Winner</span>
                                        <span className="text-yellow-400 italic">{match.matchWinner}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Result Margin</span>
                                        <span className="text-white">{match.resultMargin || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Venue</span>
                                        <span className="text-white text-right max-w-[60%]">{match.venue}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'toss' && (
                        <div className="py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-800/40 rounded-2xl p-6">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">🪙 Toss Result</p>
                                    <p className="text-white font-black text-lg italic mb-1">{match.tossWinner}</p>
                                    <p className="text-slate-400 text-sm font-bold">chose to <span className="text-yellow-400">{match.tossDecision}</span></p>
                                </div>
                                <div className="bg-slate-800/40 rounded-2xl p-6">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">📍 Venue Details</p>
                                    <p className="text-white font-black text-base italic leading-snug">{match.venue}</p>
                                    {match.date && (
                                        <p className="text-slate-400 text-sm mt-2">📅 {match.date}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const InfoCard = ({ icon, label, value, highlight }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
        <div className="flex items-center gap-2 text-yellow-400/70 mb-2">
            {React.cloneElement(icon, { size: 15 })}
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        </div>
        <p className={`text-xs font-bold leading-snug ${highlight ? 'text-yellow-400 italic' : 'text-white'}`}>
            {value || 'N/A'}
        </p>
    </div>
);

export default MatchDetails;
