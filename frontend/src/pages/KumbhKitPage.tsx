import React, { useState, useEffect } from 'react';
import { Backpack, CheckCircle2, ShieldCheck, Tag, ShoppingBag, Plus } from 'lucide-react';
import { KitItem } from '../types';
import { apiClient } from '../services/api';

export const KumbhKitPage: React.FC = () => {
  const [items, setItems] = useState<KitItem[]>([]);
  const [days, setDays] = useState('3');
  const [groupSize, setGroupSize] = useState('2');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKit() {
      setLoading(true);
      try {
        const list = await apiClient.planKit(Number(days), Number(groupSize));
        setItems(list.map((item) => ({ ...item, checked: true })));
      } catch (err) {
        console.error('Failed to load KIT:', err);
      } finally {
        setLoading(false);
      }
    }
    loadKit();
  }, [days, groupSize]);

  const toggleCheck = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  const totalEstimated = items.filter((i) => i.checked).reduce((sum, item) => sum + item.estimatedCost, 0);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-indigo-900/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Backpack className="w-4 h-4 text-indigo-400" />
            <span>Personalized Kumbh Travel KIT</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Kumbh Essential Travel KIT & Fair Prices</h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Essential spiritual, health, and weather items recommended for your pilgrimage group with verified local fair-price ranges so sellers cannot overcharge you.
          </p>
        </div>

        <div className="bg-white/10 p-4 rounded-2xl border border-white/20 text-center shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-300 block">Total KIT Estimated Cost</span>
          <span className="text-2xl font-black text-emerald-300">₹{totalEstimated.toLocaleString()}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Pilgrimage Days</label>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="1">1 Day Snan Trip</option>
              <option value="3">3 Days Standard Trip</option>
              <option value="5">5 Days Extended Trip</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Group Size</label>
            <select
              value={groupSize}
              onChange={(e) => setGroupSize(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-semibold"
            >
              <option value="1">Solo Pilgrim (1)</option>
              <option value="2">Couple / Duo (2)</option>
              <option value="4">Family (4)</option>
            </select>
          </div>
        </div>

        <span className="text-slate-500 font-medium">{items.filter((i) => i.checked).length} of {items.length} items selected</span>
      </div>

      {/* KIT Checklist */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Generating personalized Kumbh KIT...</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.checked ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleCheck(item.id)}
                  className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{item.name}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Verified Fair Price</span>
                  <span className="font-extrabold text-emerald-700">{item.fairPriceRange}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Qty Needed</span>
                  <span className="font-bold text-slate-800">{item.recommendedQuantity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
