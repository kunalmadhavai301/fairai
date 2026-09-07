import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldCheck, Star, Phone, MapPin, Award, Search, Filter } from 'lucide-react';
import { Pujari, LocationInfo } from '../types';
import { apiClient } from '../services/api';

interface PujarisPageProps {
  location: LocationInfo;
}

export const PujarisPage: React.FC<PujarisPageProps> = ({ location }) => {
  const [pujaris, setPujaris] = useState<Pujari[]>([]);
  const [selectedGhat, setSelectedGhat] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await apiClient.getPujaris(selectedGhat);
        setPujaris(list);
      } catch (err) {
        console.error('Failed to load pujaris:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedGhat]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white p-6 md:p-8 rounded-3xl border border-amber-800/40 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span>Verified Kumbh Ritual Services</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Top 10 Trusted Pujaris & Purohits</h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Ranked using weighted scoring (Rating 30%, Verification 20%, Reviews 20%, Experience & Value 30%). Recommended for sacred Godavari Mahasnan, Pitri Tarpan, & family rituals in {location.city}.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-extrabold text-slate-800 uppercase">Filter by Ghat:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['all', 'Ram Kund', 'Godavari Ghat', 'Trimbakeshwar Ghat', 'Tapovan Ghat'].map((ghat) => (
            <button
              key={ghat}
              onClick={() => setSelectedGhat(ghat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedGhat === ghat
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ghat === 'all' ? 'All Sacred Ghats' : ghat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Pujaris */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading trusted purohits...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pujaris.map((pujari) => (
            <div key={pujari.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 transition-all relative">
              {/* Rank Badge */}
              <div className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-black text-xs">
                #{pujari.rank}
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl shrink-0 border border-amber-200">
                  {pujari.name.split(' ')[1]?.[0] || 'P'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${
                        pujari.verificationBadge === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : pujari.verificationBadge === 'Official Source'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      ✓ {pujari.verificationBadge}
                    </span>
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {pujari.rating} ({pujari.reviewCount} reviews)
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base">{pujari.name}</h3>
                  <p className="text-xs font-semibold text-amber-800">{pujari.specialization}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Experience</span>
                  <span className="font-bold text-slate-800">{pujari.experienceYears} Years</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Expected Dakshina</span>
                  <span className="font-bold text-emerald-700">{pujari.priceRange}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Languages Spoken</span>
                  <span className="font-semibold text-slate-700">{pujari.languages.join(', ')}</span>
                </div>
              </div>

              <div className="space-y-1">
                {pujari.whyRecommended.map((note, idx) => (
                  <p key={idx} className="text-xs text-slate-600 font-medium">
                    {note}
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {pujari.location}
                </span>

                <a
                  href={`tel:${pujari.phone}`}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-xs hover:scale-[1.02] active:scale-95"
                  title="Click to call directly on phone dialer"
                >
                  <Phone className="w-3.5 h-3.5 text-white" />
                  <span>Call Pujari</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
