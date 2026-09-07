import React from 'react';
import { Users, TrendingUp, ShieldCheck, ArrowRight, Activity, Compass, AlertCircle } from 'lucide-react';
import { PredictionResult } from '../types';

interface CrowdPriceImpactChartProps {
  prediction?: PredictionResult | null;
}

export const CrowdPriceImpactChart: React.FC<CrowdPriceImpactChartProps> = ({ prediction }) => {
  const steps = [
    { level: 'LOW CROWD', demand: 'LOW', availability: 'HIGH', pressure: '→ STABLE', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800' },
    { level: 'MODERATE CROWD', demand: 'MODERATE', availability: 'HIGH', pressure: '→ STABLE', color: 'border-blue-200 bg-blue-50/50 text-blue-800' },
    { level: 'HIGH CROWD', demand: 'HIGH', availability: 'MODERATE', pressure: '↑ HIGHER (+15%)', color: 'border-amber-200 bg-amber-50/50 text-amber-800' },
    { level: 'VERY HIGH (SHAHI SNAN)', demand: 'SURGE', availability: 'LOW', pressure: '↑ HIGHER (+35%)', color: 'border-rose-300 bg-rose-50/60 text-rose-900' },
  ];

  const currentCrowd = prediction?.expectedCrowdLevel || 'HIGH';

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Crowd & Price Impact Visual Analytics</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">Predictive Intelligence Model</span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        How pilgrim crowd density and event schedules influence transport fare pressure and local merchant pricing around Nashik Ghats:
      </p>

      {/* 4-Step Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {steps.map((s, idx) => {
          const isActive = currentCrowd === s.level.split(' ')[0] || (currentCrowd === 'VERY_HIGH' && s.level.includes('SHAHI'));
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${s.color} ${
                isActive ? 'ring-2 ring-amber-500 shadow-md font-bold' : 'opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold uppercase text-[11px]">{s.level}</span>
                {isActive && <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black">Active Context</span>}
              </div>

              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex justify-between"><span>Demand:</span><span className="font-bold">{s.demand}</span></div>
                <div className="flex justify-between"><span>Supply:</span><span className="font-bold">{s.availability}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span>Price Pressure:</span>
                  <span className="font-black text-slate-900 dark:text-white">{s.pressure}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-world Disclaimer Note */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
        <span>
          <strong>Fairness Note:</strong> Real-world prices do not automatically rise with crowd levels. Transport fares can remain stable or decrease when regulated by RTO meter rates or high shuttle bus frequency.
        </span>
      </div>
    </div>
  );
};
