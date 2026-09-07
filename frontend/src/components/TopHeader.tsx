import React from 'react';
import { MapPin, Sparkles, Scan, Search } from 'lucide-react';
import { LocationInfo } from '../types';

interface TopHeaderProps {
  location: LocationInfo;
  onOpenLocationModal: () => void;
  onOpenScan: () => void;
  onOpenChat: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  location,
  onOpenLocationModal,
  onOpenScan,
  onOpenChat,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            F
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-base">FairBuy AI</span>
        </div>

        {/* Desktop Greeting & Tagline */}
        <div className="hidden md:block">
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Good day</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Price Intelligence Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Know the real market value before you buy.</p>
        </div>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Location Badge */}
        <button
          onClick={onOpenLocationModal}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-slate-200"
        >
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-slate-800">{location.city}, {location.state}</span>
          <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded-full font-bold ml-0.5">
            Detected
          </span>
        </button>

        {/* Primary Scan Product Button */}
        <button
          onClick={onOpenScan}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow-blue-500/20 active:scale-98"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Scan Product</span>
        </button>

        {/* Ask FairBuy Assistant */}
        <button
          onClick={onOpenChat}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-semibold border border-indigo-200/70 transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Ask FairBuy</span>
        </button>
      </div>
    </header>
  );
};
