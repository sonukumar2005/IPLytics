import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { fetchVenues } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createCustomIcon = (matchCount) => {
    const size = Math.min(40, 20 + Math.log2(matchCount + 1) * 5);
    return L.divIcon({
        className: '',
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, #facc15, #d97706);
                border: 2px solid #fbbf24;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 900;
                color: #000;
                box-shadow: 0 0 12px rgba(251,191,36,0.6);
            ">${matchCount}</div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

const VenueMap = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetchVenues()
            .then(data => { setVenues(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="h-80 flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-800">
                <div className="text-slate-500 text-xs font-black uppercase animate-pulse tracking-widest">
                    Loading stadium map...
                </div>
            </div>
        );
    }

    if (venues.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-800">
                <div className="text-slate-600 text-sm font-bold italic">No venue data available</div>
            </div>
        );
    }

    // Center of India as default
    const center = [20.5937, 78.9629];

    return (
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
            <MapContainer
                center={center}
                zoom={4}
                style={{ height: '380px', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {venues.map((venue, i) => (
                    <React.Fragment key={i}>
                        <Marker
                            position={[venue.lat, venue.lon]}
                            icon={createCustomIcon(venue.matchesPlayed)}
                            eventHandlers={{ click: () => setSelected(venue) }}
                        >
                            <Popup className="ipl-popup">
                                <div className="bg-slate-900 text-white p-2 rounded-lg min-w-[160px]">
                                    <p className="font-black text-yellow-400 text-xs uppercase mb-1">{venue.venueName}</p>
                                    <p className="text-xs text-slate-300">
                                        🏏 {venue.matchesPlayed} {venue.matchesPlayed === 1 ? 'match' : 'matches'}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                        <Circle
                            center={[venue.lat, venue.lon]}
                            radius={venue.matchesPlayed * 5000}
                            pathOptions={{
                                color: '#facc15',
                                fillColor: '#facc15',
                                fillOpacity: 0.06,
                                weight: 1,
                                opacity: 0.3,
                            }}
                        />
                    </React.Fragment>
                ))}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[999] bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-xs backdrop-blur-sm">
                <p className="font-black text-slate-400 uppercase tracking-widest text-[9px] mb-2">Legend</p>
                <div className="flex items-center gap-2 text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[7px] font-black text-black">N</div>
                    <span>= matches hosted</span>
                </div>
            </div>
        </div>
    );
};

export default VenueMap;
