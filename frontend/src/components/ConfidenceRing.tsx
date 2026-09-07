import React, { useState } from 'react';
import { ShieldCheck, Info, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ConfidenceRingProps {
  score: number;
  label: string;
  sublabel?: string;
  colorScheme?: 'emerald' | 'amber' | 'crimson' | 'indigo' | 'saffron';
  size?: 'sm' | 'md' | 'lg';
  breakdownModalData?: {
    title: string;
    factors: { name: string; weight: string; score: number; status: string }[];
    explanationText: string;
  };
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  score,
  label,
  sublabel,
  colorScheme = 'emerald',
  size = 'md',
  breakdownModalData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const radius = size === 'lg' ? 44 : size === 'md' ? 36 : 28;
  const strokeWidth = size === 'lg' ? 7 : size === 'md' ? 6 : 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorMap = {
    emerald: { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
    amber: { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' },
    crimson: { stroke: '#ef4444', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800' },
    indigo: { stroke: '#6366f1', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800' },
    saffron: { stroke: '#d97706', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  };

  const scheme = colorMap[colorScheme] || colorMap.emerald;
  const svgSize = size === 'lg' ? 104 : size === 'md' ? 88 : 72;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`relative inline-flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${scheme.bg} ${scheme.border}`}
        title="Click to view confidence calculation breakdown"
      >
        <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
          <svg className="transform -rotate-90" width={svgSize} height={svgSize}>
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-gray-200 dark:text-gray-800 fill-none"
            />
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              stroke={scheme.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="fill-none transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-extrabold ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-base'} ${scheme.text}`}>
              {score}%
            </span>
          </div>
        </div>

        <div className="mt-2 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1">
            {label}
            <Info className="w-3 h-3 text-gray-400 hover:text-gray-600" />
          </p>
          {sublabel && <p className={`text-[11px] font-medium ${scheme.text} mt-0.5`}>{sublabel}</p>}
        </div>
      </div>

      {/* Breakdown Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md max-w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  How was this score calculated?
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Target Score</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${scheme.text}`}>{score}%</span>
                  <p className="text-xs text-gray-500">{sublabel || 'Verified Evidence'}</p>
                </div>
              </div>

              {breakdownModalData ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Weighted Evidence Breakdown</p>
                  {breakdownModalData.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        {factor.score >= 75 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="font-medium text-gray-800 dark:text-gray-200">{factor.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">({factor.weight})</span>
                        <span className="font-bold text-gray-900 dark:text-white">{factor.score}%</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic leading-relaxed">
                    {breakdownModalData.explanationText}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Standard Evidence Weights</p>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-slate-800">
                      <span>Category & Object Detection</span>
                      <span className="font-semibold">20%</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-slate-800">
                      <span>Brand Identification</span>
                      <span className="font-semibold">15%</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-slate-800">
                      <span>Exact Model / Variant Detection</span>
                      <span className="font-semibold">30%</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-slate-800">
                      <span>Specifications Verification</span>
                      <span className="font-semibold">15%</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-slate-800">
                      <span>Web Search & Price Agreement</span>
                      <span className="font-semibold">20%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700 rounded-xl transition"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
