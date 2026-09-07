import React, { useState, useEffect } from 'react';
import { Car, ShieldCheck, Star, Phone, MapPin, Gauge, Calculator, CheckCircle2 } from 'lucide-react';
import { Driver, LocationInfo, RickshawFareAnalysis } from '../types';
import { apiClient } from '../services/api';

interface TransportPageProps {
  location: LocationInfo;
}

export const TransportPage: React.FC<TransportPageProps> = ({ location }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Meter Fare Calculator State
  const [pickup, setPickup] = useState('Nashik Railway Station');
  const [dropoff, setDropoff] = useState('Ram Kund, Panchavati');
  const [distanceKm, setDistanceKm] = useState('4.5');
  const [driverQuote, setDriverQuote] = useState('150');
  const [fareResult, setFareResult] = useState<RickshawFareAnalysis | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await apiClient.getDrivers();
        setDrivers(list);
      } catch (err) {
        console.error('Failed to load drivers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCalculateFare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await apiClient.calculateRickshawFare({
        pickup,
        dropoff,
        distanceKm: Number(distanceKm) || 4.5,
        driverQuotedFare: Number(driverQuote) || 150,
        location,
      });
      setFareResult(result);
    } catch (err) {
      console.error('Fare error:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl border border-blue-900/40 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Car className="w-4 h-4 text-blue-400" />
          <span>Kumbh Transport & Driver Intelligence</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Top 10 Drivers & Transport Options</h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Verify official RTO auto-rickshaw meter rates vs driver quotes in {location.city}. Access top 10 verified local drivers, shuttle routes, and fare intelligence.
        </p>
      </div>

      {/* RTO Meter Fare Calculator Widget */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-extrabold text-slate-900">Official RTO Meter vs Driver Quote Check</h3>
        </div>

        <form onSubmit={handleCalculateFare} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pickup Location</label>
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Dropoff Location</label>
            <input
              type="text"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Distance (km)</label>
            <input
              type="number"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-extrabold text-rose-700 mb-1">Driver Quoted Fare (₹)</label>
            <input
              type="number"
              value={driverQuote}
              onChange={(e) => setDriverQuote(e.target.value)}
              className="w-full px-3 py-2 font-bold border border-rose-300 bg-rose-50/50 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>

          <div className="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs transition-colors text-xs"
            >
              Verify Fare Fairness
            </button>
          </div>
        </form>

        {fareResult && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900">{fareResult.statusLabel}</span>
              <span className="font-bold text-emerald-700">Official RTO Meter: ₹{fareResult.officialMeterFare}</span>
            </div>
            <p className="text-slate-600">Fair fare range: <strong>₹{fareResult.fairFareRangeMin} – ₹{fareResult.fairFareRangeMax}</strong> (Quoted: ₹{fareResult.driverQuotedFare})</p>
            <div className="space-y-1 pt-1">
              {fareResult.localTips.map((tip, i) => (
                <p key={i} className="text-slate-500 font-medium">• {tip}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top 10 Drivers Directory */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Top 10 Verified Drivers & Transport Providers</h3>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading verified drivers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {drivers.map((driver) => (
              <div key={driver.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-400 transition-all relative">
                <div className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center font-black text-xs">
                  #{driver.rank}
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xl shrink-0 border border-blue-200">
                    {driver.driverName[0]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${
                          driver.verificationBadge === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        ✓ {driver.verificationBadge}
                      </span>
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {driver.rating} ({driver.reviewCount} trips)
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base">{driver.driverName}</h3>
                    <p className="text-xs font-semibold text-slate-600">{driver.vehicle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Safe Driving Score</span>
                    <span className="font-bold text-emerald-700">{driver.drivingScore}/100</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Pricing Basis</span>
                    <span className="font-bold text-slate-800">{driver.estimatedPrice}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {driver.whyRecommended.map((note, idx) => (
                    <p key={idx} className="text-xs text-slate-600 font-medium">
                      {note}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {driver.location}
                  </span>

                  <a
                    href={`tel:${driver.phone}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-xs hover:scale-[1.02] active:scale-95"
                    title="Click to call driver directly on phone dialer"
                  >
                    <Phone className="w-3.5 h-3.5 text-white" />
                    <span>Call Driver</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
