import React, { useState, useEffect } from 'react';
import { Database, Upload, Plus, CheckCircle2, ShieldCheck, FileText, RefreshCw, BarChart2, Cpu, Calendar, Crown, Activity } from 'lucide-react';
import { apiClient } from '../services/api';
import { ModelMetrics, KumbhEventConfig } from '../types';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<{
    productsCount: number;
    pricesCount: number;
    pujarisCount: number;
    driversCount: number;
    hotelsCount: number;
    verifiedCount: number;
    communityRatedCount: number;
    modelMetrics?: ModelMetrics;
    eventConfig?: KumbhEventConfig;
  } | null>(null);

  const [rawJson, setRawJson] = useState('');
  const [importResult, setImportResult] = useState<{ importedCount: number; validCount: number; reviewCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const s = await apiClient.getAdminStats();
        setStats(s);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawJson.trim()) return;

    try {
      const parsed = JSON.parse(rawJson);
      const res = await apiClient.importAdminData(Array.isArray(parsed) ? parsed : [parsed]);
      setImportResult(res);
      setRawJson('');
    } catch (err) {
      alert('Invalid JSON format! Please enter valid JSON array.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Nashik Simhastha 2027 & Model Monitoring Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Admin Data & Predictive Model Center</h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Manage verified price observations, Nashik Simhastha 2027 Shahi Snan dates, crowd training data, and monitor predictive model accuracy metrics (MAE, MAPE, RMSE).
          </p>
        </div>
      </div>

      {/* Overview Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Product Catalog</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{stats.productsCount} Items</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Price Observations</span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{stats.pricesCount} Signals</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Verified Providers</span>
            <span className="text-xl font-black text-blue-700 dark:text-blue-400">{stats.verifiedCount} Verified</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Community Signals</span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-400">{stats.communityRatedCount} Rated</span>
          </div>
        </div>
      )}

      {/* MODEL MONITORING METRICS CARD */}
      {stats?.modelMetrics && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Predictive Model Monitoring Metrics</h3>
            </div>
            <span className="text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200">
              {stats.modelMetrics.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Evaluated Checks</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{stats.modelMetrics.totalEvaluations.toLocaleString()}</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">MAE (Mean Abs Error)</span>
              <span className="text-lg font-black text-emerald-600">{stats.modelMetrics.mae}%</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">MAPE (Mean Abs Pct)</span>
              <span className="text-lg font-black text-indigo-600">{stats.modelMetrics.mape}%</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">RMSE Metric</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{stats.modelMetrics.rmse}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            Calibrated model version: <span className="font-bold text-slate-800 dark:text-slate-200">{stats.modelMetrics.modelVersion}</span> (Last calibrated: {stats.modelMetrics.lastCalibratedDate})
          </p>
        </div>
      )}

      {/* CSV / JSON Bulk Data Importer */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Bulk Data Feeding (JSON / CSV Upload)</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Supports Products, Prices, Pujaris, Drivers, & Event Dates</span>
        </div>

        <form onSubmit={handleImport} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Paste JSON Records Array</label>
            <textarea
              rows={5}
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              placeholder='[{"name": "Stainless Steel Thali", "category": "Utensils", "price": 210, "location": "Nashik", "verificationStatus": "Verified"}]'
              className="w-full font-mono text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
            ></textarea>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Validation rule: Automatic validation against mandatory schema</span>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Import Data into Knowledge Base
            </button>
          </div>
        </form>

        {importResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1 text-xs text-emerald-900 dark:text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2 font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Bulk Import Completed Successfully!</span>
            </div>
            <p className="font-medium">
              Imported {importResult.importedCount} total records ({importResult.validCount} valid & ingested into FairBuy engine).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
