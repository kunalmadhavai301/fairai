import React, { useState } from 'react';
import {
  Scan,
  Edit3,
  Upload,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Search,
  MapPin,
  Compass,
  Map,
  MessageSquareText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sun,
  Crown,
  Calendar,
  Clock
} from 'lucide-react';
import { ProductAnalysisFull, LocationInfo, PredictionResult } from '../types';
import { DateTimeSelectorModal } from '../components/DateTimeSelectorModal';
import { CrowdPriceImpactChart } from '../components/CrowdPriceImpactChart';

interface DashboardPageProps {
  location: LocationInfo;
  recentAnalyses: ProductAnalysisFull[];
  onOpenScan: () => void;
  onOpenManualEntry: () => void;
  onSelectAnalysis: (analysis: ProductAnalysisFull) => void;
  onQuickCheck: (productName: string, quotedPrice: number) => void;
  onOpenLocationModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  location,
  recentAnalyses,
  onOpenScan,
  onOpenManualEntry,
  onSelectAnalysis,
  onQuickCheck,
  onOpenLocationModal,
  onNavigateTab,
}) => {
  const [quickProduct, setQuickProduct] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [activePrediction, setActivePrediction] = useState<PredictionResult | null>(null);

  const handleQuickCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrice) return;
    const name = quickProduct.trim() || 'Stainless Steel Thali';
    onQuickCheck(name, Number(quickPrice));
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* 1. KUMBH SPIRITUAL HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-10 shadow-xl border border-amber-500/20 space-y-6">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Nashik Simhastha 2027 AI Companion</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Navigate Kumbh with Confidence.
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              "Know the fair price. Find trusted services. Plan your journey." Powered by evidence-grounded AI vision, real-time market data & predictive crowd models.
            </p>

            <div className="flex flex-wrap gap-3 pt-3">
              <button
                onClick={onOpenScan}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Scan className="w-4 h-4" />
                <span>Check a Price</span>
              </button>

              <button
                onClick={() => setIsDateTimeModalOpen(true)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-5 py-2.5 rounded-xl text-xs border border-amber-500/40 backdrop-blur-xs transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Plan for Date & Time</span>
              </button>

              <button
                onClick={() => onNavigateTab('kumbh-guide')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-xs border border-white/20 backdrop-blur-xs transition-all flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Explore Kumbh</span>
              </button>
            </div>
          </div>

          {/* Location & Prediction Summary Badge Card */}
          <div className="space-y-3 shrink-0">
            <div className="flex items-center gap-3 bg-slate-900/80 p-4 rounded-2xl border border-amber-500/30 backdrop-blur-md shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-extrabold shrink-0 border border-amber-500/30">
                <MapPin className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Location Active
                </span>
                <h2 className="text-sm font-black text-white mt-1">📍 {location.formatted}</h2>
                <button
                  onClick={onOpenLocationModal}
                  className="text-[11px] font-bold text-amber-400 hover:underline mt-0.5 block"
                >
                  Change Location
                </button>
              </div>
            </div>

            {activePrediction && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Selected Visit:</span>
                  <span>{activePrediction.selectedDate}</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-300">
                  <span>Expected Crowd:</span>
                  <span className="font-extrabold text-amber-400">{activePrediction.expectedCrowdLevel}</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-300">
                  <span>Price Pressure:</span>
                  <span className="font-extrabold text-white">{activePrediction.pricePressureDirection} ({activePrediction.predictionConfidence}%)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. NASHIK SIMHASTHA 2027 SHAHI SNAN DATES WIDGET */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black tracking-wide">Nashik Simhastha 2027 — Verified Shahi Snan Dates</h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Verified Event Schedule
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
            <span className="text-[10px] text-amber-400 font-extrabold uppercase block">2 August 2027</span>
            <h4 className="font-bold text-white text-xs">First Shahi Snan (Dhwajarohan)</h4>
            <p className="text-[11px] text-slate-400">Flag hoisting ceremony at Ram Kund Ghat</p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 space-y-1">
            <span className="text-[10px] text-amber-300 font-black uppercase block">14 August 2027 ★ PEAK</span>
            <h4 className="font-bold text-white text-xs">Second Shahi Snan (Shravan Purnima)</h4>
            <p className="text-[11px] text-slate-300">Main holy bathing procession at Godavari & Trimbakeshwar</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
            <span className="text-[10px] text-amber-400 font-extrabold uppercase block">1 September 2027</span>
            <h4 className="font-bold text-white text-xs">Third Shahi Snan (Amavasya)</h4>
            <p className="text-[11px] text-slate-400">Bhadrapada Amavasya sacred bath & sadhu procession</p>
          </div>
        </div>
      </div>

      {/* 3. CROWD & PRICE IMPACT VISUAL ANALYTICS */}
      <CrowdPriceImpactChart prediction={activePrediction} />

      {/* 4. DASHBOARD SMART ACTION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Scan className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Price Intelligence</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">CHECK A PRICE</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">"Is this price fair?" Scan a product or enter details to verify local vs online fair bounds.</p>
          </div>
          <button
            onClick={onOpenScan}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Scan className="w-4 h-4 text-amber-400" />
            <span>Scan Product</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Local Services</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">EXPLORE KUMBH</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">"Find trusted local services" Top Pujaris, verified transport drivers & hotels near Ghats.</p>
          </div>
          <button
            onClick={() => onNavigateTab('kumbh-guide')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Now</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-violet-400 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
              <Map className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">Itinerary Planner</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">PLAN YOUR TRIP</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">"Build a trip according to your group, time and budget." Complete with smart budget optimization.</p>
          </div>
          <button
            onClick={() => onNavigateTab('my-trips')}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Map className="w-4 h-4" />
            <span>Create My Plan</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4 group">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">AI Assistant</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">ASK FAIRBUY</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">"Have a question?" Ask AI about price evidence, legitimate variances, and transport cost trade-offs.</p>
          </div>
          <button
            onClick={() => onNavigateTab('ask-fairbuy')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquareText className="w-4 h-4" />
            <span>Chat with AI</span>
          </button>
        </div>
      </div>

      {/* 5. QUICK PRICE CHECK SECTION */}
      <div className="bg-gradient-to-r from-amber-50/80 via-indigo-50/50 to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 p-6 rounded-3xl border border-amber-200/60 dark:border-slate-800 shadow-xs space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Quick Market Price Check</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Enter what a local seller or driver is quoting right now to verify price fairness.</p>
        </div>

        <form onSubmit={handleQuickCheckSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={quickProduct}
              onChange={(e) => setQuickProduct(e.target.value)}
              placeholder="Product or Item Name (e.g. Stainless Steel Thali, Puja Kit)"
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <span className="absolute left-3.5 top-2.5 font-extrabold text-slate-600 dark:text-slate-300 text-sm">₹</span>
            <input
              type="number"
              value={quickPrice}
              onChange={(e) => setQuickPrice(e.target.value)}
              placeholder="250"
              className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-slate-800 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-xs transition-colors shrink-0"
          >
            Check Fairness
          </button>
        </form>
      </div>

      {/* Date & Time Selector Modal */}
      <DateTimeSelectorModal
        isOpen={isDateTimeModalOpen}
        onClose={() => setIsDateTimeModalOpen(false)}
        location={location}
        onSelectPrediction={(pred) => setActivePrediction(pred)}
      />
    </div>
  );
};
