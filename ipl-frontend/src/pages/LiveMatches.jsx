import React, { useEffect, useState } from "react";
import { fetchLiveMatches } from "../services/api";
import TeamLogo from "../components/TeamLogo";

const LiveMatches = () => {
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        fetchLiveMatches().then(setMatches);

        const interval = setInterval(() => {
            fetchLiveMatches().then(setMatches);
        }, 5000); // 🔥 auto refresh

        return () => clearInterval(interval);
    }, []);

    if (matches.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400">
                <h1 className="text-3xl font-bold mb-4 text-yellow-400">
                    Live IPL Matches
                </h1>
                No IPL matches right now 🏏
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-yellow-400">
                Live IPL Matches
            </h1>

            {matches.map((m, i) => (
                <div
                    key={i}
                    className="bg-slate-800 p-5 mb-5 rounded-2xl shadow-lg border border-white/5"
                >
                    {/* TEAMS */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <TeamLogo teamName={m.battingTeam} size="sm" />
                            <span className="text-white font-bold">vs</span>
                            <TeamLogo teamName={m.bowlingTeam} size="sm" />
                        </div>

                        {/* 🔴 LIVE BADGE */}
                        {m.currentBatsman?.toLowerCase().includes("live") && (
                            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                                LIVE
                            </span>
                        )}
                    </div>

                    {/* SCORE */}
                    <p className="text-yellow-400 font-bold text-lg">
                        {m.runs}/{m.wickets} ({m.overs} overs)
                    </p>

                    {/* STATUS */}
                    <p className="text-slate-400 text-sm mt-1">
                        {m.currentBatsman}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default LiveMatches;