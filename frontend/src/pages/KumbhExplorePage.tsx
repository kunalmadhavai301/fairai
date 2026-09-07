import React, { useState, useEffect } from 'react';
import { Compass, MapPin, Clock, ShieldAlert, Utensils, Church, Sparkles, Filter } from 'lucide-react';
import { KumbhLocation, LocationInfo } from '../types';
import { apiClient } from '../services/api';

interface KumbhExplorePageProps {
  location: LocationInfo;
}

export const KumbhExplorePage: React.FC<KumbhExplorePageProps> = ({ location }) => {
  const [locations, setLocations] = useState<KumbhLocation[]>([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await apiClient.getKumbhExplore(selectedType);
        setLocations(list);
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedType]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl border border-violet-900/40 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Compass className="w-4 h-4 text-violet-400" />
          <span>Kumbh Explorer & Sacred Destination Guide</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Explore Sacred Ghats, Temples & Local Culture</h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Comprehensive guide to Ram Kund, Trimbakeshwar Jyotirlinga, Sadhugram camps, Satvik dining spots, and emergency medical health posts in {location.city}.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-extrabold text-slate-800 uppercase">Category Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Destinations' },
            { id: 'ghat', label: 'Sacred Ghats' },
            { id: 'temple', label: 'Temples' },
            { id: 'food', label: 'Satvik Food' },
            { id: 'emergency', label: 'Emergency Posts' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedType === t.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Locations */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading Kumbh destinations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-violet-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  {loc.type}
                </span>
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {loc.timing}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base">{loc.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{loc.description}</p>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{loc.location}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  🌟 <strong>Best Time:</strong> {loc.bestTimeToVisit}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
