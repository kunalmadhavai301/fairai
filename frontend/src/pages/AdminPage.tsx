import React, { useState, useEffect } from 'react';
import { Database, Plus, CheckCircle2, ShieldCheck, FileText, RefreshCw, BarChart2, Phone, MapPin, Tag, Utensils, Car, Building2, UserCheck, ShoppingBag, Landmark, Code, ChevronDown, ChevronUp } from 'lucide-react';
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

  // Form State for Simple Entry Creation
  const [category, setCategory] = useState('Food & Dining');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [locationText, setLocationText] = useState('Panchavati, Nashik');
  const [description, setDescription] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('Verified');
  const [rating, setRating] = useState('4.9');

  const [addedEntries, setAddedEntries] = useState<any[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Collapsible JSON bulk tab
  const [showBulkJson, setShowBulkJson] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [importResult, setImportResult] = useState<{ importedCount: number; validCount: number; reviewCount: number } | null>(null);

  const categories = [
    { id: 'Food & Dining', label: '🍲 Food & Dining', icon: Utensils },
    { id: 'Travel & Transport', label: '🚗 Travel & Transport', icon: Car },
    { id: 'Hotels & Lodging', label: '🏨 Hotels & Lodging', icon: Building2 },
    { id: 'Pujari & Rituals', label: '🛕 Pujari & Rituals', icon: UserCheck },
    { id: 'Products & Shopping', label: '🛍️ Products & Shopping', icon: ShoppingBag },
    { id: 'Kumbh Locations & Landmarks', label: '📍 Kumbh Locations & Landmarks', icon: Landmark },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const s = await apiClient.getAdminStats();
        setStats(s);
        const entries = await apiClient.getAdminEntries();
        setAddedEntries(entries || []);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSimpleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || submitting) return;

    setSubmitting(true);
    setSubmitSuccess(null);

    const recordPayload = {
      category,
      name: name.trim(),
      price: Number(price),
      phone: phone.trim() || '+91 98220 00000',
      location: locationText.trim() || 'Nashik',
      description: description.trim() || 'Verified service listing',
      verificationStatus,
      rating: Number(rating) || 4.8,
    };

    try {
      const res = await apiClient.importAdminData([recordPayload]);
      if (res.entries) {
        setAddedEntries(res.entries);
      } else {
        setAddedEntries((prev) => [
          {
            id: `adm-${Date.now()}`,
            ...recordPayload,
            dateAdded: new Date().toLocaleDateString(),
          },
          ...prev,
        ]);
      }

      // Refresh stats
      const updatedStats = await apiClient.getAdminStats();
      setStats(updatedStats);

      setSubmitSuccess(`✓ "${name}" added successfully to Knowledge Base!`);
      setName('');
      setPrice('');
      setPhone('');
      setDescription('');
    } catch (err) {
      console.error('Failed to submit entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawJson.trim()) return;

    try {
      const parsed = JSON.parse(rawJson);
      const res = await apiClient.importAdminData(Array.isArray(parsed) ? parsed : [parsed]);
      setImportResult(res);
      if (res.entries) setAddedEntries(res.entries);
      setRawJson('');
      const updatedStats = await apiClient.getAdminStats();
      setStats(updatedStats);
    } catch (err) {
      alert('Invalid JSON format! Please enter a valid JSON array.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Database className="w-4 h-4 text-amber-400" />
            <span>Nashik Simhastha 2027 Admin Control Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Admin Data & Knowledge Base Center</h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Easily add food services, transport drivers, hotels, pujaris, products, and prices into the FairBuy AI knowledge base.
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
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Directory</span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-400">{addedEntries.length} Added</span>
          </div>
        </div>
      )}

      {/* SIMPLE INTERACTIVE ENTRY FORM FOR ADMIN */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add New Product, Service & Price Details</h3>
              <p className="text-xs text-slate-500">Fill in product/service details to make them live instantly on FairBuy AI</p>
            </div>
          </div>

          <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900">
            Interactive Admin Form
          </span>
        </div>

        {submitSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSimpleFormSubmit} className="space-y-5 text-xs">
          {/* 1. Category Selection Tabs */}
          <div className="space-y-2">
            <label className="block font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              1. Select Service / Product Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    category === cat.id
                      ? 'bg-blue-600 text-white font-extrabold border-blue-600 shadow-sm scale-102'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <span className="text-xs font-bold">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Main Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Service / Product / Driver Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shree Ram Mahaprasad Thali / Auto Shuttle Service"
                className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Price or Fair Range (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 120"
                className="w-full text-xs font-extrabold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Contact Phone / Mobile Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98220 12345"
                className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Location / Address in Nashik</span>
              </label>
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="e.g. Panchavati, Ram Kund Ghat, Nashik"
                className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Verification Status</label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
                className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
              >
                <option value="Verified">✓ Official Verified Source</option>
                <option value="Official Source">Official Government / RTO Rate</option>
                <option value="Community Verified">Community Verified Listing</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Quality / Rating Score (1.0 – 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="4.9"
                className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 3. Description / Details */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Service Description & Key Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail what is included (e.g. Unlimited Mahaprasad thali, clean dining hall, 200m from Ram Kund)..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
            ></textarea>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !name.trim() || !price}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-3 rounded-2xl text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Adding Entry...' : 'Add Entry to Knowledge Base'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* LIVE DIRECTORY TABLE OF ADDED ENTRIES */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Admin Directory & Added Entries</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">{addedEntries.length} Active Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                <th className="p-3 font-extrabold">Category</th>
                <th className="p-3 font-extrabold">Name / Title</th>
                <th className="p-3 font-extrabold">Price</th>
                <th className="p-3 font-extrabold">Location</th>
                <th className="p-3 font-extrabold">Contact Action</th>
                <th className="p-3 font-extrabold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {addedEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900">
                      {entry.category}
                    </span>
                  </td>
                  <td className="p-3 font-black text-slate-900 dark:text-white">
                    <div>{entry.name}</div>
                    <div className="text-[11px] font-normal text-slate-500">{entry.description}</div>
                  </td>
                  <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">₹{entry.price}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{entry.location}</td>
                  <td className="p-3 font-bold">
                    <a
                      href={`tel:${entry.phone}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900 dark:bg-amber-600 text-white text-[11px] font-extrabold hover:opacity-90"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call Provider</span>
                    </a>
                  </td>
                  <td className="p-3 font-extrabold">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                      ✓ {entry.verificationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPTIONAL BULK JSON IMPORT TAB */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowBulkJson(!showBulkJson)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Bulk Data Feeding (Advanced JSON Upload)</h3>
              <p className="text-xs text-slate-500">Optional: Paste JSON arrays for bulk data imports</p>
            </div>
          </div>
          {showBulkJson ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showBulkJson && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
            <form onSubmit={handleImportJson} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Paste JSON Records Array</label>
                <textarea
                  rows={4}
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  placeholder='[{"name": "Stainless Steel Thali", "category": "Food & Dining", "price": 120, "location": "Nashik", "verificationStatus": "Verified"}]'
                  className="w-full font-mono text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Validation rule: Automatic schema verification</span>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs transition-colors"
                >
                  Import Bulk JSON Array
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
                  Imported {importResult.importedCount} total records into Knowledge Base.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
