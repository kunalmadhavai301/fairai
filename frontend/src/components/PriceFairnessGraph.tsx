import React from 'react';
import { PriceFairnessResult } from '../types';

interface PriceFairnessGraphProps {
  priceIntelligence: PriceFairnessResult;
  currency?: string;
}

export const PriceFairnessGraph: React.FC<PriceFairnessGraphProps> = ({
  priceIntelligence,
  currency = '₹',
}) => {
  const {
    sellerPrice,
    fairPriceMin,
    fairPriceMax,
    lowestObserved,
    highestObserved,
    marketMedian,
    status,
    statusLabel,
  } = priceIntelligence;

  // Calculate percentage placement along visual spectrum
  const minVal = Math.min(lowestObserved, Math.round(fairPriceMin * 0.9));
  const maxVal = Math.max(highestObserved, Math.round(sellerPrice * 1.15));
  const range = maxVal - minVal || 1;

  const getPercent = (val: number) => {
    const pct = ((val - minVal) / range) * 100;
    return Math.min(95, Math.max(5, pct));
  };

  const sellerPct = getPercent(sellerPrice);
  const fairMinPct = getPercent(fairPriceMin);
  const fairMaxPct = getPercent(fairPriceMax);
  const medianPct = getPercent(marketMedian);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Price Spectrum Analysis</h3>
          <p className="text-xs text-slate-500">Market bounds vs Quoted Seller Price</p>
        </div>

        {/* Status Badge */}
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
            status === 'GOOD'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : status === 'FAIR'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : status === 'HIGH'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Main Bar Spectrum */}
      <div className="relative pt-8 pb-10 px-2">
        {/* Quoted Seller Price Marker (Floating Tooltip Pin) */}
        <div
          className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-300"
          style={{ left: `${sellerPct}%` }}
        >
          <div className="bg-slate-900 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap border border-slate-700">
            Quoted: {currency}{sellerPrice.toLocaleString()}
          </div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-6 border-t-slate-900"></div>
        </div>

        {/* Spectrum Gradient Bar */}
        <div className="h-4 w-full rounded-full bg-slate-100 relative overflow-hidden flex shadow-inner">
          {/* Below Fair / Good Zone */}
          <div style={{ width: `${fairMinPct}%` }} className="bg-emerald-300/80 h-full"></div>
          {/* Fair Range Zone (Highlighted) */}
          <div
            style={{ width: `${fairMaxPct - fairMinPct}%` }}
            className="bg-emerald-500 h-full shadow-md border-x-2 border-emerald-600/30"
          ></div>
          {/* Overpriced Zone */}
          <div style={{ width: `${100 - fairMaxPct}%` }} className="bg-gradient-to-r from-amber-400 to-rose-500 h-full"></div>
        </div>

        {/* Fair Range Overlay Bracket */}
        <div
          className="absolute bottom-3 border-b-2 border-x-2 border-emerald-600 h-2 rounded-b-md transform -translate-x-1/2 flex items-center justify-center"
          style={{
            left: `${(fairMinPct + fairMaxPct) / 2}%`,
            width: `${Math.max(15, fairMaxPct - fairMinPct)}%`,
          }}
        >
          <span className="bg-white text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-200 shadow-2xs whitespace-nowrap transform translate-y-3">
            ESTIMATED FAIR RANGE: {currency}{fairPriceMin.toLocaleString()} – {currency}{fairPriceMax.toLocaleString()}
          </span>
        </div>

        {/* Median Pin */}
        <div
          className="absolute bottom-[38px] transform -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${medianPct}%` }}
        >
          <div className="w-2 h-2 rounded-full bg-slate-900 ring-4 ring-white shadow-xs"></div>
          <span className="text-[10px] font-bold text-slate-700 mt-1 whitespace-nowrap">
            Median: {currency}{marketMedian.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Lowest</span>
          <span className="font-bold text-slate-800">{currency}{lowestObserved.toLocaleString()}</span>
        </div>
        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
          <span className="text-[10px] font-semibold text-emerald-600 block uppercase">Fair Min</span>
          <span className="font-bold text-emerald-800">{currency}{fairPriceMin.toLocaleString()}</span>
        </div>
        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
          <span className="text-[10px] font-semibold text-emerald-600 block uppercase">Fair Max</span>
          <span className="font-bold text-emerald-800">{currency}{fairPriceMax.toLocaleString()}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Highest</span>
          <span className="font-bold text-slate-800">{currency}{highestObserved.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
