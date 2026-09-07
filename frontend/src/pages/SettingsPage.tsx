import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Key, RefreshCw, Check, Database, Sparkles } from 'lucide-react';
import { AppSettings } from '../types';
import { apiClient } from '../services/api';

interface SettingsPageProps {
  settings: AppSettings;
  onSettingsUpdated: (settings: AppSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSettingsUpdated }) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await apiClient.updateSettings(formData);
      onSettingsUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">FairBuy System Settings</h1>
          <p className="text-xs text-slate-500">Configure data sources, demo mode, currency, and AI scoring parameters</p>
        </div>

        {formData.demoMode && (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-amber-600" />
            <span>Demo Data Active</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* 1. DEMO MODE TOGGLE */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-900 text-sm block">Hackathon / Presentation Demo Mode</span>
            <p className="text-xs text-slate-600">
              When enabled, uses clearly labeled sample market data fallback when external live price feeds are unavailable.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={formData.demoMode}
              onChange={(e) => setFormData({ ...formData, demoMode: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* 2. REGIONAL PREFERENCES */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Regional & Currency Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default City</label>
              <input
                type="text"
                value={formData.defaultCity}
                onChange={(e) => setFormData({ ...formData, defaultCity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default State</label>
              <input
                type="text"
                value={formData.defaultState}
                onChange={(e) => setFormData({ ...formData, defaultState: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. SCORING & DATA CACHE SETTINGS */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Engine Tuning & Cache Duration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data Cache Freshness (Minutes)</label>
              <input
                type="number"
                value={formData.cacheFreshnessMinutes}
                onChange={(e) => setFormData({ ...formData, cacheFreshnessMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fair Price Threshold (+ % Overpriced Warning)</label>
              <input
                type="number"
                value={formData.fairPriceThresholdPercent}
                onChange={(e) => setFormData({ ...formData, fairPriceThresholdPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition-colors"
          >
            Save Settings
          </button>

          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fadeIn">
              <Check className="w-4 h-4" />
              Settings saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
