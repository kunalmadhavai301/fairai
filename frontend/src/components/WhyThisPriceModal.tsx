import React from 'react';
import { HelpCircle, CheckCircle2, ShieldCheck, MapPin, Award, Activity, X } from 'lucide-react';
import { BuyingDecisionResult, PriceFairnessResult, LocationInfo } from '../types';

interface WhyThisPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceIntelligence: PriceFairnessResult;
  buyingDecision: BuyingDecisionResult;
  location: LocationInfo;
  currency?: string;
}

export const WhyThisPriceModal: React.FC<WhyThisPriceModalProps> = ({
  isOpen,
  onClose,
  priceIntelligence,
  buyingDecision,
  location,
  currency = '₹',
}) => {
  if (!isOpen) return null;

  const { fairPriceMin, fairPriceMax, marketMedian, lowestObserved, highestObserved, confidenceScore, sourcesAnalyzedCount } = priceIntelligence;
  const { whyThisPrice } = buyingDecision;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Why is the Fair Price {currency}{fairPriceMin.toLocaleString()} – {currency}{fairPriceMax.toLocaleString()}?
              </h3>
              <p className="text-xs text-slate-500">Transparent AI Price Calculation Rationale</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fact Matrix Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Market Median</span>
              <span className="font-bold text-slate-800">{currency}{marketMedian.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Observed Range</span>
              <span className="font-bold text-slate-800">{currency}{lowestObserved.toLocaleString()} – {currency}{highestObserved.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Review Rating</span>
              <span className="font-bold text-slate-800">{whyThisPrice.reviewScore} / 5.0 ★</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Warranty</span>
              <span className="font-bold text-slate-800">{whyThisPrice.warranty}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Current Location</span>
              <span className="font-bold text-slate-800">{location.formatted}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Market Confidence</span>
              <span className="font-bold text-slate-800">{confidenceScore}%</span>
            </div>
          </div>
        </div>

        {/* Natural Language Explanation Box */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 leading-relaxed space-y-2">
          <p className="font-semibold text-blue-900">Simple Language Summary:</p>
          <p>
            "FairBuy estimates this range ({currency}{fairPriceMin.toLocaleString()} – {currency}{fairPriceMax.toLocaleString()}) from {sourcesAnalyzedCount} available market signals, official brand characteristics, verified user reviews, warranty terms, and your current location context ({location.formatted})."
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Got it, thanks
          </button>
        </div>
      </div>
    </div>
  );
};
