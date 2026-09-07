import React from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquareText, ShieldCheck, Award, Zap, AlertTriangle, CheckCircle2, Globe, ExternalLink } from 'lucide-react';
import { ProductAnalysisFull } from '../types';

interface ReviewsPageProps {
  analysis: ProductAnalysisFull;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ analysis }) => {
  const { product, reviews, valueAnalysis, quotedPrice, priceIntelligence } = analysis;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Extracted Public Web Reviews</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="text-xs text-slate-500">Aggregated user sentiment and live web reviews from online marketplaces</p>
        </div>

        {/* Rating Badge */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl text-center shrink-0 min-w-36">
          <div className="flex items-center justify-center gap-1 text-amber-400 font-extrabold text-2xl">
            <span>{reviews.overallRating}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">
            {reviews.totalReviewsCount.toLocaleString()} Verified Web Reviews
          </span>
        </div>
      </div>

      {/* 1. EXTRACTED PUBLIC WEB REVIEWS FEED */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Live Public Web Reviews Extracted</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">Extracted from Amazon, Flipkart, Google & Retailers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.webReviews?.map((rev) => (
            <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{rev.author}</span>
                    {rev.verified && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{rev.comment}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                  🌐 {rev.source}
                </span>
                <span>{rev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SENTIMENT SPECTRUM BAR */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">User Sentiment Distribution</h3>

        <div className="space-y-2">
          <div className="h-4 w-full rounded-full bg-slate-100 flex overflow-hidden shadow-inner">
            <div style={{ width: `${reviews.positivePercent}%` }} className="bg-emerald-500 h-full"></div>
            <div style={{ width: `${reviews.neutralPercent}%` }} className="bg-amber-400 h-full"></div>
            <div style={{ width: `${reviews.negativePercent}%` }} className="bg-rose-500 h-full"></div>
          </div>

          <div className="flex justify-between text-xs font-semibold pt-1">
            <span className="text-emerald-700 font-bold">{reviews.positivePercent}% Positive</span>
            <span className="text-amber-700 font-bold">{reviews.neutralPercent}% Neutral</span>
            <span className="text-rose-700 font-bold">{reviews.negativePercent}% Negative</span>
          </div>
        </div>
      </div>

      {/* 3. PROS AND CONS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-200/80 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
            <span>Most Mentioned Strengths</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {reviews.pros.map((pro, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-rose-50/40 p-6 rounded-3xl border border-rose-200/80 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <ThumbsDown className="w-4 h-4 text-rose-600" />
            <span>Most Mentioned Weaknesses</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {reviews.cons.map((con, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. ASPECT EXTRACTION SCORES */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Extracted Product Aspects</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reviews.aspects.map((aspect, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">{aspect.name}</span>
                <span className="font-extrabold text-blue-600">{aspect.score}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${aspect.score}%` }}
                  className={`h-full ${aspect.score >= 80 ? 'bg-emerald-500' : aspect.score >= 70 ? 'bg-amber-400' : 'bg-rose-500'}`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. VALUE-FOR-MONEY ANALYSIS MATRIX */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Value Analysis Matrix</h3>
            <p className="text-xs text-slate-500">Quality, features, and review rating vs quoted seller price</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Overall Value: {valueAnalysis.overallValueScore}%
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Product Quality</span>
            <span className="text-xl font-extrabold text-slate-800">{valueAnalysis.qualityScore}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Features Match</span>
            <span className="text-xl font-extrabold text-slate-800">{valueAnalysis.featuresScore}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Reviews Score</span>
            <span className="text-xl font-extrabold text-slate-800">{valueAnalysis.reviewsScore}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Price Rating</span>
            <span className="text-xl font-extrabold text-blue-600">{valueAnalysis.priceScore}%</span>
          </div>
        </div>

        {/* Value Statement */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-xs font-bold text-slate-800 flex items-center justify-between">
          <span>{valueAnalysis.valueStatement}</span>
          <span className="text-[11px] text-blue-600 bg-white px-3 py-1 rounded-xl shadow-2xs border border-blue-100">
            Calculated by FairBuy Engine
          </span>
        </div>
      </div>
    </div>
  );
};
