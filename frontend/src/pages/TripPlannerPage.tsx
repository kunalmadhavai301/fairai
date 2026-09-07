import React, { useState } from 'react';
import { Map, Calendar, Users, Wallet, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { TripPlan, LocationInfo } from '../types';
import { apiClient } from '../services/api';

interface TripPlannerPageProps {
  location: LocationInfo;
}

export const TripPlannerPage: React.FC<TripPlannerPageProps> = ({ location }) => {
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(2);
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(10000);
  const [travelStyle, setTravelStyle] = useState<'Budget' | 'Balanced' | 'Comfort' | 'Premium'>('Balanced');
  const [hasElderly, setHasElderly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TripPlan | null>(null);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await apiClient.planTrip({
        adults: Number(adults),
        children: Number(children),
        days: Number(days),
        budget: Number(budget),
        travelStyle,
        hasElderly,
      });
      setPlan(result);
    } catch (err) {
      console.error('Trip planner error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl border border-violet-900/40 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Map className="w-4 h-4 text-violet-400" />
          <span>AI Kumbh Itinerary & Budget Optimizer</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Personalized Kumbh Trip & Budget Planner</h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Input your group size, duration, and budget. FairBuy AI builds an optimized day-by-day pilgrimage itinerary and automatically adjusts stays and transport if costs exceed your budget!
        </p>
      </div>

      {/* Input Form Wizard */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-slate-900">Tell FairBuy About Your Trip</h3>

        <form onSubmit={handleGeneratePlan} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Adults (18+ yrs)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Children (under 18)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Trip Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-extrabold text-emerald-700 mb-1">Total Trip Budget (₹)</label>
              <input
                type="number"
                step="500"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 font-black border border-emerald-300 bg-emerald-50/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-emerald-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Travel Style</label>
              <select
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none font-semibold"
              >
                <option value="Budget">Budget Pilgrimage (Ashram / Yatri Niwas & Shared Autos)</option>
                <option value="Balanced">Balanced Comfort (3-Star Hotel & Meter Autos)</option>
                <option value="Comfort">Comfort Family (4-Star Hotel & AC Taxi)</option>
                <option value="Premium">Premium VIP (5-Star Hotel & Private Vehicle)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 w-full">
                <input
                  type="checkbox"
                  checked={hasElderly}
                  onChange={(e) => setHasElderly(e.target.checked)}
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <span>Includes Elderly Pilgrims (Prefers E-Rickshaws & Less Walking)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Building Optimized Itinerary...' : 'Build My Kumbh Trip Plan'}</span>
          </button>
        </form>

        {/* Plan Output */}
        {plan && (
          <div className="space-y-6 pt-6 border-t border-slate-100 animate-fadeIn">
            {/* Optimization Alert */}
            {plan.optimized && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Smart Budget Optimization Applied!</span>
                </div>
                {plan.optimizationNotes?.map((note, idx) => (
                  <p key={idx} className="text-amber-800 font-medium pl-6">
                    {note}
                  </p>
                ))}
              </div>
            )}

            {/* Budget Breakdown Cards */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Calculated Cost vs Budget</span>
                  <h4 className="text-xl font-black text-white">
                    ₹{plan.costBreakdown.totalCalculated.toLocaleString()} / ₹{plan.totalBudget.toLocaleString()} Budget
                  </h4>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  Remaining Buffer: ₹{plan.remainingBudget.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accommodation</span>
                  <span className="font-bold text-white">₹{plan.costBreakdown.accommodation.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Food & Dining</span>
                  <span className="font-bold text-white">₹{plan.costBreakdown.food.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Transport & Rides</span>
                  <span className="font-bold text-white">₹{plan.costBreakdown.transport.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Puja & Rituals</span>
                  <span className="font-bold text-white">₹{plan.costBreakdown.puja.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Daily Itinerary Timeline */}
            <div className="space-y-4">
              <h4 className="text-base font-extrabold text-slate-900">Day-by-Day Pilgrimage Itinerary</h4>

              {plan.dailyItinerary.map((day) => (
                <div key={day.dayNumber} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-black text-slate-900 text-sm">{day.dateLabel}: {day.title}</span>
                    <span className="font-extrabold text-emerald-700 text-xs">Estimated Day Total: ₹{day.dailyTotalCost}</span>
                  </div>

                  <div className="space-y-3">
                    {day.activities.map((act, i) => (
                      <div key={i} className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-extrabold text-violet-600 block">{act.time}</span>
                          <span className="font-extrabold text-slate-900">{act.activity}</span>
                          <span className="text-[11px] text-slate-500 block">📍 {act.location} ({act.transportMode})</span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cost</span>
                          <span className="font-bold text-slate-800">₹{act.costTotal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
