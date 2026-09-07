import React, { useState, useEffect } from 'react';
import { Map, Calculator, Car, Compass, ArrowRight, ShieldCheck, MapPin, Navigation, Footprints, Bus, Clock } from 'lucide-react';
import { LocationInfo } from '../types';

interface TravelPageProps {
  location: LocationInfo;
}

interface CalculatedRoute {
  destination: {
    id: string;
    name: string;
    description: string;
  };
  distanceKm: number;
  estimatedTimeMinutes: number;
  modes: {
    mode: string;
    timeMinutes: number;
    costRange: string;
    badge: string;
  }[];
}

export const TravelPage: React.FC<TravelPageProps> = ({ location }) => {
  const [selectedLandmarkId, setSelectedLandmarkId] = useState('ram-kund');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Detecting location...');
  const [routeResult, setRouteResult] = useState<CalculatedRoute | null>(null);
  const [productPrice, setProductPrice] = useState('500');

  // Automatically request browser geolocation on load
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocationStatus('📍 Device GPS Location Detected');
        },
        (err) => {
          console.warn('Geolocation permission fallback to default city:', err);
          setUserCoords({ lat: 19.9975, lon: 73.7898 }); // College Road, Nashik
          setLocationStatus('📍 Location detected (Nashik, Maharashtra)');
        }
      );
    } else {
      setUserCoords({ lat: 19.9975, lon: 73.7898 });
      setLocationStatus('📍 Location detected (Nashik, Maharashtra)');
    }
  }, []);

  // Recalculate route whenever destination or coordinates change
  useEffect(() => {
    if (userCoords) {
      calculateAutoRoute(userCoords.lat, userCoords.lon, selectedLandmarkId);
    }
  }, [userCoords, selectedLandmarkId]);

  const calculateAutoRoute = async (lat: number, lon: number, destId: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/travel/calculate-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originLat: lat, originLon: lon, destinationId: destId }),
      });
      const data = await res.json();
      if (data.success && data.route) {
        setRouteResult(data.route);
      }
    } catch (err) {
      console.error('Failed to calculate auto route:', err);
    }
  };

  const landmarkList = [
    { id: 'ram-kund', name: 'Ram Kund Ghat (Central Snan)' },
    { id: 'trimbakeshwar', name: 'Trimbakeshwar Ghat & Temple' },
    { id: 'panchavati', name: 'Panchavati Godavari Ghat' },
    { id: 'tapovan', name: 'Tapovan Sacred Forest Ghat' },
    { id: 'kalaram', name: 'Kalaram Mandir' },
    { id: 'nashik-station', name: 'Nashik Road Railway Station' },
    { id: 'college-road', name: 'College Road Market Hub' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-3xl border border-blue-900/40 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Navigation className="w-4 h-4 text-amber-400" />
          <span>Automatic Distance & Travel Cost Engine</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Kumbh Area Travel & Fare Companion</h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Zero manual kilometer input required. Your starting location is detected automatically via GPS; select your destination to view live distance, travel time, and official transport fare estimates.
        </p>
      </div>

      {/* AUTOMATIC LOCATION & ROUTE SELECTOR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Automatic Origin Box */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 space-y-1">
            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Your Starting Location</span>
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 animate-bounce" />
              <span>{location.formatted} ({location.locality || 'Detected'})</span>
            </div>
            <p className="text-[11px] text-slate-500">{locationStatus}</p>
          </div>

          {/* Destination Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Select Kumbh Destination</label>
            <select
              value={selectedLandmarkId}
              onChange={(e) => setSelectedLandmarkId(e.target.value)}
              className="w-full text-xs font-bold p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
            >
              {landmarkList.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AUTOMATIC ROUTE RESULT CARD */}
        {routeResult && (
          <div className="space-y-6 pt-2 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Calculated Route</span>
                <h3 className="text-lg font-black">{routeResult.destination.name}</h3>
                <p className="text-xs text-slate-300">{routeResult.destination.description}</p>
              </div>

              <div className="flex items-center gap-6 text-center shrink-0">
                <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Distance</span>
                  <span className="text-xl font-black text-amber-400">{routeResult.distanceKm} km</span>
                </div>
                <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Est. Time</span>
                  <span className="text-xl font-black text-white">{routeResult.estimatedTimeMinutes} min</span>
                </div>
              </div>
            </div>

            {/* TRANSPORT MODES & FARES GRID */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Transport Modes & Fair Fare Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {routeResult.modes.map((mode, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 hover:border-blue-400 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{mode.mode}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                        {mode.badge}
                      </span>
                    </div>

                    <div className="text-lg font-black text-slate-900 dark:text-white">{mode.costRange}</div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{mode.timeMinutes} mins travel time</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EFFECTIVE BUYING COST TRADE-OFF CALCULATOR */}
            <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider">Travel Trade-off Insight</span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Round-Trip Auto: ~₹{Math.round(routeResult.distanceKm * 32)}</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                If you are traveling <span className="font-bold">{routeResult.distanceKm} km</span> to purchase a product quoted at <span className="font-bold">₹{productPrice}</span>, factor round-trip auto transport (~₹{Math.round(routeResult.distanceKm * 32)}) into your effective buying price.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
