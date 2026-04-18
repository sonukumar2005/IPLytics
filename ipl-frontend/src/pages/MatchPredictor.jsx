import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, Trophy, RefreshCw, Swords } from 'lucide-react';
import { predictMatchResult, fetchTeams, fetchVenuesList } from '../services/api';
import HeadToHead from '../components/HeadToHead';

const MatchPredictor = () => {
    const [formData, setFormData] = useState({
        team1: '', team2: '', venue: '', tossWinner: '', tossDecision: 'bat'
    });
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [teams, setTeams] = useState([]);
    const [venues, setVenues] = useState([]);

    useEffect(() => {
        fetchTeams().then(setTeams).catch(console.error);
        fetchVenuesList().then(setVenues).catch(console.error);
    }, []);

    const handlePredict = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setPrediction(null);
        try {
            const result = await predictMatchResult(formData);
            if (result.error) throw new Error(result.error);
            setPrediction(result);
        } catch (err) {
            setError(err.message || 'Could not get prediction. Is the ML service running on port 5000?');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setPrediction(null);
        setError(null);
        setFormData({ team1: '', team2: '', venue: '', tossWinner: '', tossDecision: 'bat' });
    };

    const confidencePct = prediction ? (prediction.confidence * 100).toFixed(1) : 0;

    const SelectField = ({ label, value, onChange, options, placeholder, required }) => (
        <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <select
                className="w-full bg-slate-800/80 border border-slate-700 text-white p-3.5 rounded-xl focus:border-yellow-400/60 outline-none transition-colors text-xs font-bold cursor-pointer hover:border-slate-600"
                value={value}
                onChange={onChange}
                required={required}
            >
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-2 mb-5">
                    <BrainCircuit size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">AI Powered</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
                    MATCH <span className="text-yellow-400">PREDICTOR</span>
                </h1>
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
                    Powered by Random Forest · Trained on IPL historical data
                </p>
            </motion.div>

            {/* Main grid: Predictor + HeadToHead */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mb-12">

                {/* ── Predictor Form ── */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 h-full">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <BrainCircuit size={16} className="text-yellow-400" />
                            Configure Match
                        </h2>

                        <form onSubmit={handlePredict} className="space-y-4">
                            <SelectField
                                label="Team 1 (Home)"
                                value={formData.team1}
                                onChange={e => setFormData({ ...formData, team1: e.target.value, tossWinner: '' })}
                                options={teams}
                                placeholder="Select Team 1..."
                                required
                            />
                            <SelectField
                                label="Team 2 (Away)"
                                value={formData.team2}
                                onChange={e => setFormData({ ...formData, team2: e.target.value, tossWinner: '' })}
                                options={teams.filter(t => t !== formData.team1)}
                                placeholder="Select Team 2..."
                                required
                            />
                            <SelectField
                                label="Match Venue"
                                value={formData.venue}
                                onChange={e => setFormData({ ...formData, venue: e.target.value })}
                                options={venues}
                                placeholder="Select Stadium..."
                                required
                            />

                            {/* Toss Winner */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Toss Winner</label>
                                <select
                                    className="w-full bg-slate-800/80 border border-slate-700 text-white p-3.5 rounded-xl focus:border-yellow-400/60 outline-none transition-colors text-xs font-bold cursor-pointer hover:border-slate-600"
                                    value={formData.tossWinner}
                                    onChange={e => setFormData({ ...formData, tossWinner: e.target.value })}
                                    required
                                >
                                    <option value="">Who won the toss?</option>
                                    {formData.team1 && <option value={formData.team1}>{formData.team1}</option>}
                                    {formData.team2 && <option value={formData.team2}>{formData.team2}</option>}
                                </select>
                            </div>

                            {/* Toss Decision */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Toss Decision</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['bat', 'field'].map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, tossDecision: d })}
                                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                                                formData.tossDecision === d
                                                    ? 'bg-yellow-400 text-black border-yellow-400'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                            }`}
                                        >
                                            {d === 'bat' ? '🏏 Bat First' : '🌿 Bowl First'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs transition-all ${
                                        loading
                                            ? 'bg-slate-800 text-slate-500'
                                            : 'bg-yellow-400 text-black hover:bg-yellow-300 hover:shadow-xl hover:shadow-yellow-900/30'
                                    }`}
                                >
                                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                                    {loading ? 'Analyzing...' : 'Generate Prediction'}
                                </button>
                                {(prediction || error) && (
                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="px-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </motion.div>

                {/* ── Prediction Result ── */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">

                    <AnimatePresence mode="wait">
                        {!prediction && !loading && !error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-800 rounded-3xl min-h-[300px]"
                            >
                                <BrainCircuit size={48} className="text-slate-800 mb-4" />
                                <p className="text-slate-600 font-bold uppercase italic text-sm">
                                    Configure match parameters and generate a prediction
                                </p>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-950/30 border border-red-800/50 p-8 rounded-3xl text-center min-h-[300px] flex flex-col items-center justify-center"
                            >
                                <p className="text-red-400 font-black uppercase text-sm mb-2">Service Error</p>
                                <p className="text-red-300/60 text-xs font-medium leading-relaxed max-w-xs">{error}</p>
                                <p className="text-slate-600 text-[10px] mt-4 uppercase tracking-widest">
                                    Make sure Flask ML service is running: <code className="text-slate-500">python app.py</code>
                                </p>
                            </motion.div>
                        )}

                        {prediction && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9, rotate: -1 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                className="flex-1"
                            >
                                {/* Winner card */}
                                <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-600/5 border border-yellow-400/30 rounded-3xl p-8 text-center mb-4">
                                    <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center text-yellow-400 mx-auto mb-4">
                                        <Trophy size={32} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Predicted Victor</span>
                                    <h2 className="text-3xl md:text-4xl font-black text-yellow-400 uppercase italic my-3 leading-none">
                                        {prediction.predicted_winner}
                                    </h2>

                                    {/* Confidence bar */}
                                    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Confidence</span>
                                            <span className="text-yellow-400 font-black text-sm">{confidencePct}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${confidencePct}%` }}
                                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                                className="h-full rounded-full"
                                                style={{
                                                    background: confidencePct >= 70
                                                        ? 'linear-gradient(to right, #22c55e, #16a34a)'
                                                        : confidencePct >= 50
                                                        ? 'linear-gradient(to right, #eab308, #ca8a04)'
                                                        : 'linear-gradient(to right, #ef4444, #dc2626)'
                                                }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-slate-600 mt-2 uppercase tracking-widest">
                                            {confidencePct >= 70 ? '💪 High Confidence' : confidencePct >= 50 ? '🤔 Moderate Confidence' : '⚠️ Low Confidence'}
                                        </p>
                                    </div>
                                </div>

                                {/* Match parameters recap */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Match Parameters Used</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div><span className="text-slate-500">Team 1:</span> <span className="text-white font-bold">{formData.team1}</span></div>
                                        <div><span className="text-slate-500">Team 2:</span> <span className="text-white font-bold">{formData.team2}</span></div>
                                        <div><span className="text-slate-500">Venue:</span> <span className="text-slate-300 font-bold truncate">{formData.venue}</span></div>
                                        <div><span className="text-slate-500">Toss:</span> <span className="text-yellow-400 font-bold">{formData.tossWinner} · {formData.tossDecision}</span></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ── Head-to-Head Section ── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <Swords size={20} className="text-yellow-400" />
                    <h2 className="text-2xl font-black text-white uppercase italic">
                        Rivalry <span className="text-yellow-400">Stats</span>
                    </h2>
                </div>
                <HeadToHead />
            </motion.div>
        </div>
    );
};

export default MatchPredictor;
