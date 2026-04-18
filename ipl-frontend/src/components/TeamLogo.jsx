import React from 'react';
import { getTeamData } from '../utils/teamData';

const TeamLogo = ({ teamName, size = 'md', showName = false }) => {
    const team = getTeamData(teamName);
    const sizeMap = {
        xs: 'w-6 h-6 text-[8px]',
        sm: 'w-8 h-8 text-[10px]',
        md: 'w-12 h-12 text-xs',
        lg: 'w-16 h-16 text-sm',
        xl: 'w-24 h-24 text-base',
    };

    const [imgError, setImgError] = React.useState(false);
    const logoPath = `/logos/${teamName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`;

    return (
        <div className={`flex items-center gap-2 ${showName ? '' : 'justify-center'}`}>
            <div
                className={`${sizeMap[size]} rounded-xl flex items-center justify-center font-black overflow-hidden shrink-0 border border-white/10`}
                style={{ background: `${team.color}22` }}
            >
                {!imgError ? (
                    <img
                        src={logoPath}
                        alt={teamName}
                        className="w-full h-full object-contain p-1"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span
                        className="font-black"
                        style={{ color: team.color || '#eab308' }}
                    >
                        {team.abbr}
                    </span>
                )}
            </div>
            {showName && (
                <span className="font-bold text-white uppercase italic text-sm leading-tight">
                    {teamName}
                </span>
            )}
        </div>
    );
};

export default TeamLogo;
