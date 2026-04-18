import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import VenueMap from '../components/VenueMap';

const VenuesPage = () => {
    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-2 mb-5">
                    <MapPin size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">Stadium Locations</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic leading-none mb-4">
                    IPL <span className="text-yellow-400">VENUES</span>
                </h1>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                    Every IPL stadium on the map — bubble size = matches hosted
                </p>
            </motion.div>

            {/* Map */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-10"
            >
                <VenueMap />
            </motion.div>
        </div>
    );
};

export default VenuesPage;
