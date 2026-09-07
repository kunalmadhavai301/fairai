import React, { useState } from 'react';
import { History, Search, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Calendar, MapPin } from 'lucide-react';
import { ProductAnalysisFull } from '../types';

interface HistoryPageProps {
  history: ProductAnalysisFull[];
  onSelectAnalysis: (analysis: ProductAnalysisFull) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onSelectAnalysis }) => {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredHistory = history.filter((item) =>
    item.product.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.product.brand.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.location.formatted.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Search & Audit Trail</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Analyzed Product History</h1>
          <p className="text-xs text-slate-500">Review past price checks, fair ranges, and buying recommendations</p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search past checks..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-bold text-sm text-slate-700">No past product checks found</p>
            <p className="text-xs text-slate-400">Scan a product to record your first price intelligence check.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="p-4">Product & Brand</th>
                  <th className="p-4">Quoted Price</th>
                  <th className="p-4">Fair Price Range</th>
                  <th className="p-4">Buying Decision</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((item) => {
                  const status = item.buyingDecision.recommendation;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectAnalysis(item)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-9 h-9 rounded-lg object-cover border border-slate-100 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                              {item.product.brand[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.product.name}</p>
                            <span className="text-[10px] text-slate-400 font-normal">{item.product.brand}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-extrabold text-slate-900">
                        ₹{item.quotedPrice.toLocaleString()}
                      </td>

                      <td className="p-4 font-extrabold text-emerald-700">
                        ₹{item.priceIntelligence.fairPriceMin.toLocaleString()} – ₹{item.priceIntelligence.fairPriceMax.toLocaleString()}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${
                            status === 'BUY'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : status === 'CONSIDER'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 text-[11px]">
                        📍 {item.location.city}
                      </td>

                      <td className="p-4 text-right">
                        <button className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          <span>View</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
