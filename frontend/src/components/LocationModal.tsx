import React, { useState } from 'react';
import { MapPin, Navigation, Check, X, Building2 } from 'lucide-react';
import { LocationInfo } from '../types';
import { apiClient } from '../services/api';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationInfo;
  onLocationUpdated: (loc: LocationInfo) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onLocationUpdated,
}) => {
  const [cityInput, setCityInput] = useState(currentLocation.city);
  const [stateInput, setStateInput] = useState(currentLocation.state);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    setLoadingGeo(true);
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setLoadingGeo(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await apiClient.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          onLocationUpdated(loc);
          setLoadingGeo(false);
          onClose();
        } catch (err) {
          setGeoError('Failed to reverse geocode device location.');
          setLoadingGeo(false);
        }
      },
      (err) => {
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please enter your location manually below.'
            : 'Unable to retrieve location coordinates.'
        );
        setLoadingGeo(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;

    try {
      const loc = await apiClient.reverseGeocode(undefined, undefined, cityInput.trim(), stateInput.trim() || 'Maharashtra');
      onLocationUpdated(loc);
      onClose();
    } catch (err) {
      setGeoError('Failed to save manual location.');
    }
  };

  const popularCities = [
    { city: 'Nashik', state: 'Maharashtra' },
    { city: 'Mumbai', state: 'Maharashtra' },
    { city: 'Pune', state: 'Maharashtra' },
    { city: 'Bengaluru', state: 'Karnataka' },
    { city: 'Delhi NCR', state: 'Delhi' },
    { city: 'Hyderabad', state: 'Telangana' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Set Price Analysis Location</h2>
              <p className="text-xs text-slate-500">Local prices vary by location, taxes, & availability</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status */}
        <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Active Location</span>
            <p className="text-sm font-bold text-slate-900">{currentLocation.formatted}</p>
          </div>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            {currentLocation.source === 'device' ? 'GPS Detected' : 'Configured'}
          </span>
        </div>

        {/* Browser Geolocation Permission Trigger */}
        <div className="space-y-4">
          <button
            onClick={handleDetectLocation}
            disabled={loadingGeo}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm disabled:opacity-50"
          >
            <Navigation className={`w-4 h-4 ${loadingGeo ? 'animate-spin' : ''}`} />
            <span>{loadingGeo ? 'Requesting GPS Location...' : 'Use Current Device Location'}</span>
          </button>

          {geoError && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
              {geoError}
            </div>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="shrink-0 mx-3 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Or Select Manually</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Quick Popular Cities */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Popular Indian Tech Hubs
            </label>
            <div className="grid grid-cols-3 gap-2">
              {popularCities.map((item) => (
                <button
                  key={item.city}
                  onClick={async () => {
                    setCityInput(item.city);
                    setStateInput(item.state);
                    const loc = await apiClient.reverseGeocode(undefined, undefined, item.city, item.state);
                    onLocationUpdated(loc);
                    onClose();
                  }}
                  className={`text-xs p-2 rounded-xl border text-center font-medium transition-all ${
                    currentLocation.city === item.city
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {item.city}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City Name</label>
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="e.g. Nashik"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State / Region</label>
              <input
                type="text"
                value={stateInput}
                onChange={(e) => setStateInput(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
              >
                Save Location
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
