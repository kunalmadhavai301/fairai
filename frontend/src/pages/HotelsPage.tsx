import React, { useState, useEffect } from 'react';
import { Building2, Star, MapPin, CheckCircle2, Phone, Filter, Users, Wifi } from 'lucide-react';
import { Hotel, LocationInfo } from '../types';
import { apiClient } from '../services/api';

interface HotelsPageProps {
  location: LocationInfo;
}

export const HotelsPage: React.FC<HotelsPageProps> = ({ location }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [familyOnly, setFamilyOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await apiClient.getHotels(budgetFilter, familyOnly);
        setHotels(list);
      } catch (err) {
        console.error('Failed to load hotels:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [budgetFilter, familyOnly]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 text-white p-6 md:p-8 rounded-3xl border border-indigo-900/40 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>Kumbh Hotel & Yatri Niwas Intelligence</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Top 10 Stays & Pilgrim Lodgings</h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Top verified hotels, Yatri Niwas, and Ashram stays ranked by proximity to bathing Ghats, verified price value, and family amenities in {location.city}.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-extrabold text-slate-800 uppercase">Budget Tier:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Tiers' },
            { id: 'budget', label: 'Budget (< ₹1,500)' },
            { id: 'mid', label: 'Mid-Range (₹1.5k–₹3.5k)' },
            { id: 'premium', label: 'Premium (> ₹3.5k)' },
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => setBudgetFilter(b.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                budgetFilter === b.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            checked={familyOnly}
            onChange={(e) => setFamilyOnly(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span>Family & Children Friendly Only</span>
        </label>
      </div>

      {/* Hotel Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading verified stays...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-400 transition-all relative">
              <div className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center justify-center font-black text-xs">
                #{hotel.rank}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${
                      hotel.verificationBadge === 'Verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    ✓ {hotel.verificationBadge}
                  </span>
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {hotel.rating} ({hotel.reviewCount} reviews)
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">{hotel.name}</h3>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {hotel.location} (<strong>{hotel.distanceToGhatKm} km to Ram Kund</strong>)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Price / Night</span>
                  <span className="font-extrabold text-emerald-700 text-base">₹{hotel.pricePerNight.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Proximity Rank</span>
                  <span className="font-bold text-slate-800">{hotel.distanceToGhatKm < 1 ? '🔥 Walking Distance' : `${hotel.distanceToGhatKm} km`}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {hotel.amenities.map((amenity, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
                    {amenity}
                  </span>
                ))}
              </div>

              <div className="space-y-1">
                {hotel.whyRecommended.map((note, idx) => (
                  <p key={idx} className="text-xs text-slate-600 font-medium">
                    {note}
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">
                  {hotel.familyFriendly ? '👨‍👩‍👧‍👦 Family Friendly' : 'Single/Double Room'}
                </span>

                <a
                  href={`tel:${hotel.phone}`}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Call Hotel</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
