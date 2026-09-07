import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, HelpCircle, ArrowRight, Activity, MapPin, Sparkles, ShieldAlert, FileQuestion, Search, RefreshCw } from 'lucide-react';
import { ProductAnalysisFull } from '../types';
import { PriceFairnessGraph } from '../components/PriceFairnessGraph';
import { WhyThisPriceModal } from '../components/WhyThisPriceModal';
import { ConfidenceRing } from '../components/ConfidenceRing';

interface BuyDecisionPageProps {
  analysis: ProductAnalysisFull;
  onOpenLocationModal: () => void;
  onNavigateToAlternatives: () => void;
  onOpenReportModal?: (item: string, quoted: number, fairMax: number, type: 'product_overcharging' | 'mrp_violation') => void;
}

export const BuyDecisionPage: React.FC<BuyDecisionPageProps> = ({
  analysis,
  onOpenLocationModal,
  onNavigateToAlternatives,
  onOpenReportModal,
}) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const { product, quotedPrice, location, priceIntelligence, buyingDecision, reviews, valueAnalysis } = analysis;
  const { recommendation, overallScore, reason, componentScores, decisionConfidence } = buyingDecision;

  const isInsufficientData = recommendation === 'INSUFFICIENT_DATA' || decisionConfidence < 60;
  const isOverpriced = !isInsufficientData && (recommendation !== 'BUY' || priceIntelligence.priceDeltaPercent > 10);
  const kumbhContext = priceIntelligence.kumbhContext;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* 1. PRODUCT HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-lg shrink-0">
              {product.brand[0]}
            </div>
          )}
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{product.category}</span>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{product.name}</h1>
            <p className="text-xs text-slate-500">📍 {location.formatted} • Checked {priceIntelligence.lastUpdatedText}</p>
          </div>
        </div>

        <button
          onClick={onOpenLocationModal}
          className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
        >
          Change Location
        </button>
      </div>

      {/* 2. CIRCULAR CONFIDENCE SCORES */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multi-Stage Confidence Score Pipeline</h3>
          <span className="text-[11px] text-slate-400">Click ring for calculation formula</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ConfidenceRing
            score={product.confidence}
            label="Product Match"
            sublabel={product.confidence >= 88 ? 'High confidence' : 'Moderate'}
            colorScheme={product.confidence >= 88 ? 'emerald' : 'amber'}
            size="md"
          />

          <ConfidenceRing
            score={priceIntelligence.confidenceScore}
            label="Price Data"
            sublabel={`${priceIntelligence.sourcesAnalyzedCount} sources`}
            colorScheme="indigo"
            size="md"
          />

          <ConfidenceRing
            score={reviews.reviewConfidenceScore || 88}
            label="Review Signal"
            sublabel={`${reviews.totalReviewsCount.toLocaleString()} reviews`}
            colorScheme="amber"
            size="md"
          />

          <ConfidenceRing
            score={decisionConfidence}
            label="Decision Score"
            sublabel={isInsufficientData ? 'Low Confidence' : recommendation}
            colorScheme={isInsufficientData ? 'amber' : recommendation === 'BUY' ? 'emerald' : recommendation === 'CONSIDER' ? 'amber' : 'crimson'}
            size="md"
          />
        </div>
      </div>

      {/* 3. INSUFFICIENT DATA WARNING CARD */}
      {isInsufficientData ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-amber-300 dark:border-amber-700 shadow-md space-y-6">
          <div className="text-center space-y-3 pb-6 border-b border-amber-100 dark:border-slate-800">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-base font-black bg-amber-500 text-white border border-amber-600 shadow-md">
                <FileQuestion className="w-5 h-5" />
                <span>INSUFFICIENT DATA</span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buying Recommendation Uncertain ({decisionConfidence}%)</h2>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 max-w-xl mx-auto leading-relaxed bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 font-medium">
              "{reason}"
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">How to resolve and get an accurate decision:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={onOpenLocationModal}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-blue-400 transition"
              >
                <Search className="w-5 h-5 text-blue-600 mb-2" />
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">Add Model Number</h5>
                <p className="text-[11px] text-slate-500">Enter full model string e.g. WH-1000XM5</p>
              </button>

              <button
                onClick={onOpenLocationModal}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-blue-400 transition"
              >
                <RefreshCw className="w-5 h-5 text-emerald-600 mb-2" />
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">Add More Photos</h5>
                <p className="text-[11px] text-slate-500">Scan product label or box serial</p>
              </button>

              <button
                onClick={onOpenLocationModal}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-blue-400 transition"
              >
                <Search className="w-5 h-5 text-indigo-600 mb-2" />
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">Search Manually</h5>
                <p className="text-[11px] text-slate-500">Search exact brand catalog</p>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 4. STANDARD BUY / CONSIDER / AVOID DECISION CARD */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          <div className="text-center space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SHOULD YOU BUY THIS?</span>

            {/* Prominent Recommendation Status Badge */}
            <div className="flex justify-center">
              <div
                className={`inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full text-xl font-black tracking-wide shadow-md border ${
                  recommendation === 'BUY'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20'
                    : recommendation === 'CONSIDER'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                    : 'bg-rose-600 text-white border-rose-700 shadow-rose-500/20'
                }`}
              >
                {recommendation === 'BUY' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : recommendation === 'CONSIDER' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
                <span>{recommendation}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{overallScore}</span>
              <span className="text-sm font-semibold text-slate-400"> / 100 Overall Score</span>
            </div>

            {/* Rationale Sentence */}
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 max-w-xl mx-auto leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 font-medium">
              "{reason}"
            </p>
          </div>

          {/* KUMBH EVENT PRICE CONTEXT CALLOUT */}
          {kumbhContext && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-300">📍 Kumbh Event-Period Location Context</span>
                <span className="text-[10px] font-extrabold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-full">
                  +{kumbhContext.kumbhSurgePercent}% Local Demand
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-800 dark:text-slate-200 font-medium">
                <div>Standard Market Range: <span className="font-bold">₹{kumbhContext.normalMarketMin.toLocaleString()} – ₹{kumbhContext.normalMarketMax.toLocaleString()}</span></div>
                <div>Kumbh-Area Local Range: <span className="font-bold text-amber-700 dark:text-amber-300">₹{kumbhContext.kumbhAreaMin.toLocaleString()} – ₹{kumbhContext.kumbhAreaMax.toLocaleString()}</span></div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                "{kumbhContext.explanation}"
              </p>
            </div>
          )}

          {/* OVERCHARGING CONSUMER ACTION ZONE TRIGGER */}
          {isOverpriced && onOpenReportModal && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-rose-900 block">Seller charging +{priceIntelligence.priceDeltaPercent}% over fair range!</span>
                  <span className="text-rose-700">File a formal report to Legal Metrology & Consumer Protection Forum.</span>
                </div>
              </div>

              <button
                onClick={() => onOpenReportModal(product.name, quotedPrice, priceIntelligence.fairPriceMax, 'product_overcharging')}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-xl shrink-0 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Report Overcharging</span>
              </button>
            </div>
          )}

          {/* COMPONENT SCORES BREAKDOWN */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Decision Factors Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Price</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">{componentScores.price}/100</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Quality</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">{componentScores.quality}/100</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Reviews</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">{componentScores.reviews}/100</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Value</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">{componentScores.value}/100</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Availability</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">{componentScores.availability}/100</span>
              </div>
            </div>
          </div>

          {/* PRICE FAIRNESS SPECTRUM GRAPH */}
          <PriceFairnessGraph priceIntelligence={priceIntelligence} />

          {/* "WHY THIS PRICE?" EXPLANATION TRIGGER */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Why is the estimated fair price ₹{priceIntelligence.fairPriceMin.toLocaleString()}–₹{priceIntelligence.fairPriceMax.toLocaleString()}?</span>
                <span className="text-slate-500">View transparent market median, IQR calculation, & confidence metrics</span>
              </div>
            </div>

            <button
              onClick={() => setShowWhyModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shrink-0 transition-colors shadow-xs"
            >
              Explain Decision
            </button>
          </div>

          {recommendation !== 'BUY' && (
            <div className="pt-2">
              <button
                onClick={onNavigateToAlternatives}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-xs transition-colors"
              >
                <span>View Better Lower-Priced Alternatives</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Why This Price Modal */}
      <WhyThisPriceModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        priceIntelligence={priceIntelligence}
        buyingDecision={buyingDecision}
        location={location}
      />
    </div>
  );
};
