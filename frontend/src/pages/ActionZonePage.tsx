import React, { useState, useEffect } from 'react';
import { ShieldAlert, Scale, AlertOctagon, CheckCircle2, Building2, Car, FileText, Search, Plus, ExternalLink, Clock } from 'lucide-react';
import { OverchargingReport, LocationInfo } from '../types';
import { apiClient } from '../services/api';

interface ActionZonePageProps {
  location: LocationInfo;
  onOpenReportModal: () => void;
}

export const ActionZonePage: React.FC<ActionZonePageProps> = ({ location, onOpenReportModal }) => {
  const [reports, setReports] = useState<OverchargingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await apiClient.getReports();
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const filtered = reports.filter((r) =>
    r.itemOrTripName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.sellerOrDriverName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.reportId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white p-6 md:p-8 rounded-3xl border border-rose-900/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Consumer Protection & Enforcement</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Consumer Action Zone & Report Portal</h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Report price gouging, overcharging above MRP, false warranties, or auto-rickshaw meter refusal directly to regional regulatory authorities in {location.city}.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs shadow-lg hover:shadow-rose-600/30 transition-all shrink-0 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>File Overcharging Report</span>
        </button>
      </div>

      {/* Regulatory Action Zone Authorities */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-slate-900">Legal Metrology Inspectorate</h3>
          <p className="text-[11px] text-slate-500">Enforces Package Commodity Rules & MRP regulations against retail shops.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Car className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-slate-900">RTO Transport Enforcement</h3>
          <p className="text-[11px] text-slate-500">Enforces official RTO auto-rickshaw meter tariffs and investigates meter refusal.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xs text-slate-900">Consumer Protection Forum</h3>
          <p className="text-[11px] text-slate-500">Official Consumer Dispute Redressal Commission for price extortion claims.</p>
        </div>
      </div>

      {/* Reports Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Enforcement Complaints Log</h3>
            <p className="text-xs text-slate-500">Logged consumer reports undergoing regulatory review in {location.city}</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 text-xs border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading action zone complaints...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No matching consumer reports found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => (
              <div key={report.reportId} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-xs">{report.reportId}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                      {report.reportType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                      report.status === 'FILED'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : report.status === 'NOTICE_ISSUED'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : report.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {report.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Item / Trip</span>
                    <span className="font-bold text-slate-800">{report.itemOrTripName}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Offender Details</span>
                    <span className="font-bold text-slate-800">{report.sellerOrDriverName}</span>
                    <span className="block text-[10px] text-slate-500">{report.shopAddressOrVehicleNo}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Overcharging Delta</span>
                    <span className="font-extrabold text-rose-600">₹{report.quotedPrice} vs ₹{report.fairPriceMax} (+{report.priceDeltaPercent}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                  <span>Target Authority: <strong>{report.authorityTarget}</strong></span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
