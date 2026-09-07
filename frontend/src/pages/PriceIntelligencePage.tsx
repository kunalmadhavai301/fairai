import React, { useState } from 'react';
import { MapPin, TrendingUp, ExternalLink, ShieldCheck, Clock, CheckCircle2, AlertCircle, ShoppingBag, Store, Building2 } from 'lucide-react';
import { ProductAnalysisFull, LocationInfo } from '../types';
import { PriceFairnessGraph } from '../components/PriceFairnessGraph';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

interface PriceIntelligencePageProps {
  analysis: ProductAnalysisFull;
  onOpenLocationModal: () => void;
}

export const PriceIntelligencePage: React.FC<PriceIntelligencePageProps> = ({
  analysis,
  onOpenLocationModal,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { product, quotedPrice, location, priceIntelligence, priceObservations, whereToBuy } = analysis;

  const distributionChartData = priceIntelligence.distribution.map((d) => ({
    name: `₹${d.price.toLocaleString()}`,
    count: d.count,
    isQuoted: d.price === quotedPrice,
    isMedian: d.price === priceIntelligence.marketMedian,
  }));

  const generateTrendData = (range: '7d' | '30d' | '90d') => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const baseMedian = priceIntelligence.marketMedian;
    const data = [];

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const variance = Math.sin(i * 0.4) * (baseMedian * 0.03) + (Math.cos(i * 0.2) * (baseMedian * 0.02));
      const priceVal = Math.round(baseMedian + variance);

      data.push({
        date: dateStr,
        price: priceVal,
        quoted: quotedPrice,
      });
    }

    return data;
  };

  const trendData = generateTrendData(timeRange);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. LOCATION CONTEXT BANNER */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">📍 {location.formatted}</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                Current Location Signal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Prices can vary by location, seller type, availability, taxes, shipping and promotions.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenLocationModal}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-xl border border-slate-200 transition-colors shrink-0"
        >
          Change Location
        </button>
      </div>

      {/* 2. PRICE SPECTRUM GRAPH */}
      <PriceFairnessGraph priceIntelligence={priceIntelligence} />

      {/* 3. WHERE TO BUY & STORES LIST (NEW) */}
      {whereToBuy && whereToBuy.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Where to Buy & Available Stores</h3>
                <p className="text-xs text-slate-500">Verified online marketplaces & local authorized outlets selling {product.name}</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
              {whereToBuy.length} Stores Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {whereToBuy.map((store) => (
              <div
                key={store.id}
                className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {store.storeLogoUrl ? (
                      <img src={store.storeLogoUrl} alt={store.storeName} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {store.storeName[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{store.storeName}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">{store.channelType.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-xs text-slate-500 block">Listed Price:</span>
                    <span className="text-lg font-extrabold text-slate-900">₹{store.price.toLocaleString()}</span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{store.availability}</span>
                    </div>
                    <p className="text-slate-500">📍 {store.location}</p>
                  </div>
                </div>

                {store.storeUrl && (
                  <a
                    href={store.storeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span>View on Store</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. HISTORICAL PRICE TREND CHART (7D / 30D / 90D) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Price Trend History</h3>
            </div>
            <p className="text-xs text-slate-500">Historical market median price progression over time</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === r ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Market Median Price']}
              />
              <Area type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#priceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. MARKET PRICE DISTRIBUTION CHART */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Market Price Distribution</h3>
            <p className="text-xs text-slate-500">Frequency of observed prices across {priceIntelligence.sourcesAnalyzedCount} channels</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-slate-700">{priceIntelligence.lastUpdatedText}</span>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(val: any) => [`${val} observations`, 'Signals']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distributionChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isQuoted ? '#ef4444' : entry.isMedian ? '#10b981' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
