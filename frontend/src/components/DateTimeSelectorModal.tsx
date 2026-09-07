import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Sparkles, X, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck, Compass } from 'lucide-react';
import { LocationInfo, PredictionResult } from '../types';

interface DateTimeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationInfo;
  onSelectPrediction?: (result: PredictionResult) => void;
}

export const DateTimeSelectorModal: React.FC<DateTimeSelectorModalProps> = ({
  isOpen,
  onClose,
  location,
  onSelectPrediction,
}) => {
  const [selectedDate, setSelectedDate] = useState('2027-08-14'); // Shahi Snan Date
  const [selectedTime, setSelectedTime] = useState('18:30');
  const [destinationId, setDestinationId] = useState('ram-kund');
  const [baselinePrice, setBaselinePrice] = useState('500');

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPrediction();
    }
  }, [isOpen, selectedDate, selectedTime, destinationId]);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/predictive/price-pressure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedDate,
          selectedTime,
          originLocation: location.formatted,
          destinationId,
          baselinePrice: Number(baselinePrice) || 500,
        }),
      });
      const data = await res.json();
      if (data.success && data.prediction) {
        setPrediction(data.prediction);
        if (onSelectPrediction) {
          onSelectPrediction(data.prediction);
        }
      }
    } catch (err) {
      console.error('Failed to fetch prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const destinations = [
    { id: 'ram-kund', name: 'Ram Kund Ghat (Central Snan)' },
    { id: 'trimbakeshwar', name: 'Trimbakeshwar Ghat & Temple' },
    { id: 'panchavati', name: 'Panchavati Godavari Ghat' },
    { id: 'tapovan', name: 'Tapovan Sacred Forest Ghat' },
    { id: 'kalaram', name: 'Kalaram Mandir' },
    { id: 'nashik-station', name: 'Nashik Road Railway Station' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl max-w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-500/30 p-4 sm:p-6 md:p-8 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 tracking-wider">Nashik Simhastha 2027</span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Plan / Check for Date & Time</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date & Time Picker Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Visit Date</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Shahi Snan peak: 14 August 2027</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Visit Time</span>
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Peak Bathing: 06:00 AM – 09:30 AM</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>Current Location</span>
            </label>
            <input
              type="text"
              readOnly
              value={location.formatted}
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Destination Landmark</span>
            </label>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* PREDICTIVE PRICE & CROWD RESULTS CARD */}
        {prediction && (
          <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-4 text-xs animate-fadeIn">
            {prediction.isShahiSnan && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SHAHI SNAN EVENT DAY: {prediction.shahiSnanTitle}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/50">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Expected Crowd</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">{prediction.expectedCrowdLevel}</span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/50">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Expected Demand</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{prediction.expectedDemandLevel}</span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/50">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Price Pressure</span>
                <span className={`text-sm font-black ${prediction.pricePressureDirection === 'HIGHER' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {prediction.pricePressureDirection === 'HIGHER' ? '↑ HIGHER' : '→ STABLE'}
                </span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900/50">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Confidence</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{prediction.predictionConfidence}%</span>
              </div>
            </div>

            {/* Rationale Sentence */}
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40">
              "{prediction.reasoning}"
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Model: <span className="font-semibold text-slate-700 dark:text-slate-300">{prediction.modelVersion}</span></span>
              <span>Predicted Price Range: <span className="font-bold text-slate-900 dark:text-white">₹{prediction.predictedPriceMin} – ₹{prediction.predictedPriceMax}</span></span>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs shadow-md transition"
          >
            Apply Date & Time Prediction
          </button>
        </div>
      </div>
    </div>
  );
};
