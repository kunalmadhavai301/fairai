import React, { useState } from 'react';
import { Sparkles, Star, ArrowRight, CheckCircle2, MessageSquare, Search } from 'lucide-react';
import { ProductAnalysisFull, AlternativeProduct } from '../types';
import { apiClient } from '../services/api';

interface AlternativesPageProps {
  analysis?: ProductAnalysisFull;
  onSelectAlternative: (alt: AlternativeProduct) => void;
}

export const AlternativesPage: React.FC<AlternativesPageProps> = ({
  analysis,
  onSelectAlternative,
}) => {
  const [requirementQuery, setRequirementQuery] = useState('');
  const [userReqResult, setUserReqResult] = useState<any | null>(null);
  const [loadingReq, setLoadingReq] = useState(false);

  const alternatives = analysis?.alternatives || [];

  const handleRequirementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirementQuery.trim() || loadingReq) return;

    setLoadingReq(true);
    try {
      const res = await apiClient.processRequirement(requirementQuery, analysis?.quotedPrice);
      setUserReqResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReq(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alternative Recommendations</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Better Market Alternatives</h1>
          <p className="text-xs text-slate-500">Products with comparable specifications, higher review ratings, or better value</p>
        </div>
      </div>

      {/* 1. "TELL FAIRBUY WHAT YOU NEED" REQUIREMENT ASSISTANT */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-md border border-slate-800 space-y-4">
        <div>
          <span className="text-blue-400 text-[11px] font-bold uppercase tracking-wider block">AI Requirement Matcher</span>
          <h2 className="text-lg md:text-xl font-bold text-white">Tell FairBuy what you need</h2>
          <p className="text-xs text-slate-300">Describe your intended use case or priority features to filter optimal models.</p>
        </div>

        <form onSubmit={handleRequirementSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={requirementQuery}
              onChange={(e) => setRequirementQuery(e.target.value)}
              placeholder="e.g. I need headphones for daily travel with good battery life"
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 text-white text-xs border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loadingReq || !requirementQuery.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors shrink-0 disabled:opacity-50"
          >
            {loadingReq ? 'Analyzing...' : 'Find Matches'}
          </button>
        </form>

        {/* User Requirement Result Output */}
        {userReqResult && (
          <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/15 space-y-3 text-xs animate-fadeIn">
            <div className="flex flex-wrap gap-4 text-[11px]">
              <div>
                <span className="text-slate-400 font-semibold block">Extracted Use Case:</span>
                <span className="font-bold text-blue-300">{userReqResult.extractedUseCase}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Top Priority:</span>
                <span className="font-bold text-emerald-300">{userReqResult.priority}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {userReqResult.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-xs">{rec.productName}</h4>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                      {rec.matchPercent}% Match
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-semibold">Price: {rec.expectedPriceRange}</p>
                  <ul className="space-y-1 text-[11px] text-slate-200">
                    {rec.why.map((w: string, widx: number) => (
                      <li key={widx}>{w}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. ALTERNATIVE PRODUCTS GRID */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Recommended Alternative Models</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alternatives.map((alt) => (
            <div
              key={alt.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  {alt.badge && (
                    <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                      {alt.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs ml-auto">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{alt.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {alt.imageUrl ? (
                    <img src={alt.imageUrl} alt={alt.name} className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-base shrink-0">
                      {alt.brand[0]}
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{alt.name}</h4>
                    <p className="text-[11px] text-slate-500">{alt.brand} {alt.model}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Key Advantage</span>
                  <p className="text-xs text-slate-700 font-medium">{alt.keyFeature}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Fair Market Price</span>
                    <span className="font-extrabold text-slate-900 text-sm">₹{alt.price.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Value Score</span>
                    <span className="font-extrabold text-emerald-600">{alt.valueScore}/100</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectAlternative(alt)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Select This Model</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SIDE-BY-SIDE SPECIFICATION COMPARISON TABLE */}
      {analysis && alternatives.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Side-by-Side Specification Comparison</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-3 font-bold text-slate-700">Feature / Spec</th>
                  <th className="p-3 font-bold text-blue-700">Target Product ({analysis.product.brand})</th>
                  {alternatives.map((alt) => (
                    <th key={alt.id} className="p-3 font-bold text-slate-900">{alt.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold text-slate-600">Quoted / Fair Price</td>
                  <td className="p-3 font-extrabold text-rose-600">₹{analysis.quotedPrice.toLocaleString()} (Quoted)</td>
                  {alternatives.map((alt) => (
                    <td key={alt.id} className="p-3 font-extrabold text-emerald-600">₹{alt.price.toLocaleString()} (Fair)</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-600">User Rating</td>
                  <td className="p-3 font-bold text-slate-800">{analysis.reviews.overallRating} ★</td>
                  {alternatives.map((alt) => (
                    <td key={alt.id} className="p-3 font-bold text-slate-800">{alt.rating} ★</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-600">Overall Value Score</td>
                  <td className="p-3 font-bold text-slate-800">{analysis.valueAnalysis.overallValueScore}%</td>
                  {alternatives.map((alt) => (
                    <td key={alt.id} className="p-3 font-extrabold text-emerald-600">{alt.valueScore}%</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
