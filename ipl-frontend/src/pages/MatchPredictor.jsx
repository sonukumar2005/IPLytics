import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BrainCircuit, Send, Trophy, RefreshCw, Swords,
    TrendingUp, Shield, Zap
} from 'lucide-react';
import { predictMatchResult, fetchTeams, fetchVenuesList } from '../services/api';
import HeadToHead from '../components/HeadToHead';

/* ── Team colour map for visual identity ─────────────────────────── */
const TEAM_COLORS = {
    'Mumbai Indians':              '#004BA0',
    'Chennai Super Kings':         '#F9CD05',
    'Kolkata Knight Riders':       '#3A225D',
    'Royal Challengers Bangalore': '#EC1C24',
    'Sunrisers Hyderabad':         '#F7A721',
    'Delhi Capitals':              '#0078BC',
    'Punjab Kings':                '#DCMB1F',
    'Rajasthan Royals':            '#2D4DB1',
    'Gujarat Titans':              '#1C2951',
    'Lucknow Super Giants':        '#A72056',
    'Deccan Chargers':             '#FB8C00',
    'Rising Pune Supergiants':     '#6F368B',
    'Gujarat Lions':               '#E35A0A',
    'Pune Warriors':               '#1a73e8',
};

const teamColor = (name) => TEAM_COLORS[name] || '#eab308';

/* ── Sub-components ──────────────────────────────────────────────── */
const SelectField = ({ label, value, onChange, options, placeholder, required }) => (
    <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            {label}
        </label>
        <select
            className="w-full bg-slate-800/80 border border-slate-700 text-white p-3.5 rounded-xl
                       focus:border-yellow-400/60 outline-none transition-colors text-xs font-bold
                       cursor-pointer hover:border-slate-600"
            value={value}
            onChange={onChange}
            required={required}
        >
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>
);

/* ── Win-probability animated bar ────────────────────────────────── */
const WinBar = ({ team1, team2, prob1, prob2 }) => {
    const c1 = teamColor(team1);
    const c2 = teamColor(team2);

    return (
        <div className="w-full">
            {/* Labels */}
            <div className="flex justify-between items-end mb-2">
                <div className="text-left">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{team1}</p>
                    <p className="text-2xl font-black" style={{ color: c1 }}>{prob1}%</p>
                </div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest self-center">vs</div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{team2}</p>
                    <p className="text-2xl font-black" style={{ color: c2 !== '#DCM...' ? c2 : '#eab308' }}>{prob2}%</p>
                </div>
            </div>

            {/* Split bar */}
            <div className="h-5 w-full rounded-full overflow-hidden flex bg-slate-800">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prob1}%` }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                    className="h-full rounded-l-full"
                    style={{ background: `linear-gradient(to right, ${c1}99, ${c1})` }}
                />
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prob2}%` }}
                    transition={{ duration: 1.4, ease: 'easeOut' }}
                    className="h-full rounded-r-full"
                    style={{ background: `linear-gradient(to left, ${c2}99, ${c2})` }}
                />
            </div>
        </div>
    );
};

/* ── Stat pill ───────────────────────────────────────────────────── */
const StatPill = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2">
        <Icon size={12} className="text-yellow-400 shrink-0" />
        <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-xs font-black text-white">{value}</p>
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
const MatchPredictor = () => {
    const [formData, setFormData] = useState({
        team1: '', team2: '', venue: '', tossWinner: '', tossDecision: 'bat'
    });
    const [prediction, setPrediction]   = useState(null);
    const [loading,    setLoading]      = useState(false);
    const [error,      setError]        = useState(null);
    const [teams,      setTeams]        = useState([]);
    const [venues,     setVenues]       = useState([]);

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

    /* Normalise both old (confidence) and new (team1Probability) response formats */
    const t1Prob = prediction
        ? (prediction.team1Probability ?? (prediction.confidence * 100))
        : null;
    const t2Prob = prediction
        ? (prediction.team2Probability ?? (100 - t1Prob))
        : null;
    const winner = prediction
        ? (prediction.predictedWinner ?? prediction.predicted_winner)
        : null;

    const confidenceLevel = t1Prob != null
        ? (Math.max(t1Prob, t2Prob) >= 60 ? 'High' : Math.max(t1Prob, t2Prob) >= 53 ? 'Moderate' : 'Close')
        : '';

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">

            {/* ── Page Header ─────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-2 mb-5">
                    <BrainCircuit size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">XGBoost AI · IPL 2008–2024</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
                    MATCH <span className="text-yellow-400">PREDICTOR</span>
                </h1>
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
                    34 Cricket Features · Probability Calibration · Trained on 1090 matches
                </p>
            </motion.div>

            {/* ── Main Grid ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mb-12">

                {/* ── Predictor Form ─────────────────────────────── */}
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
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                    Toss Winner
                                </label>
                                <select
                                    className="w-full bg-slate-800/80 border border-slate-700 text-white p-3.5 rounded-xl
                                               focus:border-yellow-400/60 outline-none transition-colors text-xs font-bold
                                               cursor-pointer hover:border-slate-600"
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
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                    Toss Decision
                                </label>
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
                                    className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black
                                                uppercase tracking-widest text-xs transition-all ${
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
                                        className="px-4 rounded-2xl bg-slate-800 border border-slate-700
                                                   text-slate-400 hover:text-white transition-all"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </motion.div>

                {/* ── Prediction Result ──────────────────────────── */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6">
                    <AnimatePresence mode="wait">

                        {/* Empty state */}
                        {!prediction && !loading && !error && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center text-center p-12
                                           border-2 border-dashed border-slate-800 rounded-3xl min-h-[380px]"
                            >
                                <BrainCircuit size={48} className="text-slate-800 mb-4" />
                                <p className="text-slate-600 font-bold uppercase italic text-sm">
                                    Configure match parameters and generate a prediction
                                </p>
                            </motion.div>
                        )}

                        {/* Error state */}
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-950/30 border border-red-800/50 p-8 rounded-3xl text-center
                                           min-h-[300px] flex flex-col items-center justify-center"
                            >
                                <p className="text-red-400 font-black uppercase text-sm mb-2">Service Error</p>
                                <p className="text-red-300/60 text-xs font-medium leading-relaxed max-w-xs">{error}</p>
                                <p className="text-slate-600 text-[10px] mt-4 uppercase tracking-widest">
                                    Make sure Flask ML service is running: <code className="text-slate-500">python app.py</code>
                                </p>
                            </motion.div>
                        )}

                        {/* Result state */}
                        {prediction && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="flex-1 flex flex-col gap-4"
                            >
                                {/* Winner banner */}
                                <div
                                    className="relative overflow-hidden rounded-3xl p-8 text-center border border-yellow-400/20"
                                    style={{
                                        background: `linear-gradient(135deg, ${teamColor(winner)}22 0%, #0f172a 60%)`
                                    }}
                                >
                                    {/* Glow orb */}
                                    <div
                                        className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl opacity-30"
                                        style={{ background: teamColor(winner) }}
                                    />

                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                                             style={{ background: `${teamColor(winner)}33`, border: `1px solid ${teamColor(winner)}55` }}>
                                            <Trophy size={28} style={{ color: teamColor(winner) }} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                            Predicted Victor
                                        </span>
                                        <h2 className="text-3xl md:text-4xl font-black uppercase italic my-2 leading-none"
                                            style={{ color: teamColor(winner) }}>
                                            {winner}
                                        </h2>
                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-1"
                                             style={{ background: `${teamColor(winner)}22`, color: teamColor(winner) }}>
                                            <Zap size={10} />
                                            {confidenceLevel} Confidence
                                        </div>
                                    </div>
                                </div>

                                {/* Dual probability bar */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TrendingUp size={12} className="text-yellow-400" />
                                        Win Probability
                                    </p>
                                    <WinBar
                                        team1={prediction.team1}
                                        team2={prediction.team2}
                                        prob1={t1Prob}
                                        prob2={t2Prob}
                                    />
                                </div>

                                {/* Match parameters recap */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Shield size={10} className="text-slate-600" />
                                        Match Parameters
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatPill icon={Swords} label="Team 1" value={formData.team1 || '—'} />
                                        <StatPill icon={Swords} label="Team 2" value={formData.team2 || '—'} />
                                        <StatPill icon={Shield} label="Toss"
                                            value={`${formData.tossWinner?.split(' ').pop() || '—'} · ${formData.tossDecision}`} />
                                        <StatPill icon={TrendingUp} label="Venue"
                                            value={formData.venue?.split(',')[0]?.slice(0, 22) || '—'} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ── Head-to-Head Section ─────────────────────────────── */}
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
