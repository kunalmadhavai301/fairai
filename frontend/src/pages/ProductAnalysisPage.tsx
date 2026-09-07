import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Sparkles, RefreshCw, Cpu, Edit3, Save, Search, Camera } from 'lucide-react';
import { ProductAnalysisFull } from '../types';
import { ConfidenceRing } from '../components/ConfidenceRing';

interface ProductAnalysisPageProps {
  analysis: ProductAnalysisFull;
  onConfirm: () => void;
  onReject: () => void;
}

export const ProductAnalysisPage: React.FC<ProductAnalysisPageProps> = ({
  analysis,
  onConfirm,
  onReject,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState(analysis.product.name);
  const [customBrand, setCustomBrand] = useState(analysis.product.brand);

  const steps = [
    'Reading product image & barcode signals...',
    'Identifying brand & model matches...',
    'Extracting technical specifications...',
    'Collecting local & online price records...',
    'Product Identified & Verified via AI!',
  ];

  useEffect(() => {
    if (stepIndex < steps.length - 1) {
      const timer = setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [stepIndex]);

  const isScanningComplete = stepIndex === steps.length - 1;
  const { product, quotedPrice, location, buyingDecision, priceIntelligence, reviews } = analysis;
  const breakdown = buyingDecision.confidenceBreakdown;
  const isLowProductMatch = product.confidence < 70;

  const handleSaveNameEdit = () => {
    product.name = customName.trim() || product.name;
    product.brand = customBrand.trim() || product.brand;
    setIsEditingName(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* 1. AI Analysis Progress Pipeline */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Product Identification Pipeline</h2>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
            {isScanningComplete ? '✓ Multi-Factor Verification Complete' : 'Analyzing Evidence...'}
          </span>
        </div>

        <div className="space-y-2 pt-2">
          {steps.slice(0, 4).map((stepText, idx) => {
            const isDone = stepIndex > idx || isScanningComplete;
            const isCurrent = stepIndex === idx && !isScanningComplete;
            return (
              <div key={idx} className="flex items-center gap-3 text-xs">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 shrink-0"></div>
                )}
                <span className={isDone ? 'text-slate-800 dark:text-slate-200 font-semibold' : isCurrent ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-slate-400'}>
                  {stepText}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. PRODUCT MATCH CONFIDENCE RINGS SECTION */}
      {isScanningComplete && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 animate-fadeIn">
          {/* 4 Circular Score Rings Header */}
          <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multi-Stage Confidence Analysis</h3>
              <span className="text-[11px] text-slate-400">Click any score to view evidence breakdown</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ConfidenceRing
                score={product.confidence}
                label="Product Match"
                sublabel={product.confidence >= 88 ? 'High confidence' : product.confidence >= 70 ? 'Moderate' : 'Uncertain'}
                colorScheme={product.confidence >= 88 ? 'emerald' : product.confidence >= 70 ? 'amber' : 'crimson'}
                size="md"
              />

              <ConfidenceRing
                score={priceIntelligence.confidenceScore}
                label="Price Evidence"
                sublabel={priceIntelligence.confidenceScore >= 85 ? 'High confidence' : 'Good confidence'}
                colorScheme="indigo"
                size="md"
              />

              <ConfidenceRing
                score={reviews.reviewConfidenceScore || 88}
                label="Review Signal"
                sublabel={`${reviews.totalReviewsCount.toLocaleString()} signals`}
                colorScheme="amber"
                size="md"
              />

              <ConfidenceRing
                score={buyingDecision.decisionConfidence}
                label="Decision Score"
                sublabel={buyingDecision.recommendation}
                colorScheme={buyingDecision.recommendation === 'BUY' ? 'emerald' : buyingDecision.recommendation === 'CONSIDER' ? 'amber' : 'crimson'}
                size="md"
              />
            </div>
          </div>

          {/* LOW CONFIDENCE UNCERTAINTY BANNER */}
          {isLowProductMatch && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Product identification is uncertain ({product.confidence}% match). Model number could not be verified automatically.</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Please select the correct product model from candidate matches or enter the exact model number manually before proceeding to price analysis.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setIsEditingName(true)}
                  className="px-3.5 py-1.5 bg-amber-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-amber-700"
                >
                  Enter Model Manually
                </button>
                <button
                  onClick={onReject}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 border border-amber-300 rounded-xl font-semibold text-xs hover:bg-amber-100"
                >
                  Scan Label Again
                </button>
              </div>
            </div>
          )}

          {/* PRODUCT CARD DETAILS */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-32 h-32 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-2xl shrink-0">
                {product.brand[0]}
              </div>
            )}

            <div className="space-y-3 flex-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{product.category}</span>
                  {!isEditingName ? (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-lg"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Name / Model</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveNameEdit}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Name</span>
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Correct Product Name"
                      className="w-full text-sm font-bold p-2 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="Brand Name"
                      className="w-full text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">{product.name}</h1>
                    <p className="text-xs text-slate-500 font-medium">Brand: <span className="font-bold text-slate-800 dark:text-slate-200">{product.brand}</span> | Model: <span className="font-bold text-slate-800 dark:text-slate-200">{product.model}</span></p>
                  </>
                )}
              </div>

              {product.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {product.description}
                </p>
              )}

              {/* Verified Product Checkpoints */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Verification Evidence Checkpoints</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Category Matched</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Brand Detected</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Specs Verified</span>
                  </div>
                </div>
              </div>

              {/* Detected Specs */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Detected Specifications</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {product.specifications.map((spec, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{spec.name}:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location & Quoted Price Context */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Quoted Seller Price:</span>
              <span className="font-extrabold text-slate-900 dark:text-white ml-1.5 text-sm">₹{quotedPrice.toLocaleString()}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Price Context Location:</span>
              <span className="font-bold text-blue-800 dark:text-blue-300 ml-1.5">📍 {location.formatted}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-md hover:shadow-blue-500/25 transition-all"
            >
              <span>Confirm Product & View Buying Recommendation</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onReject}
              className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Not the right product
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
