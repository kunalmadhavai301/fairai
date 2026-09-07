import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle2, X, Building2, Car, FileText, Send, Scale } from 'lucide-react';
import { LocationInfo, OverchargingReport } from '../types';
import { apiClient } from '../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItemOrTrip?: string;
  initialQuotedPrice?: number;
  initialFairPriceMax?: number;
  initialReportType?: 'product_overcharging' | 'rickshaw_meter_refusal' | 'mrp_violation' | 'false_warranty';
  location: LocationInfo;
  onReportFiled?: (report: OverchargingReport) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  initialItemOrTrip = 'Target Product / Trip',
  initialQuotedPrice = 1200,
  initialFairPriceMax = 1000,
  initialReportType = 'product_overcharging',
  location,
  onReportFiled,
}) => {
  const [reportType, setReportType] = useState(initialReportType);
  const [itemOrTripName, setItemOrTripName] = useState(initialItemOrTrip);
  const [quotedPrice, setQuotedPrice] = useState(String(initialQuotedPrice));
  const [fairPriceMax, setFairPriceMax] = useState(String(initialFairPriceMax));
  const [sellerName, setSellerName] = useState('');
  const [shopAddressOrVehicle, setShopAddressOrVehicle] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [filedReport, setFiledReport] = useState<OverchargingReport | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const report = await apiClient.submitReport({
        itemOrTripName: itemOrTripName.trim(),
        reportType,
        quotedPrice: Number(quotedPrice) || 1200,
        fairPriceMax: Number(fairPriceMax) || 1000,
        sellerOrDriverName: sellerName.trim() || 'Unregistered Local Seller/Driver',
        shopAddressOrVehicleNo: shopAddressOrVehicle.trim() || `${location.city} Local Market`,
        city: location.city,
        evidenceNotes: evidenceNotes.trim(),
      });

      setFiledReport(report);
      if (onReportFiled) onReportFiled(report);
    } catch (err) {
      console.error('Report filing error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 font-black flex items-center justify-center text-lg shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Consumer Action Zone Report</h3>
              <p className="text-xs text-slate-500 font-medium">File formal complaint against overcharging or extortion</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {filedReport ? (
          /* SUCCESS REPORT FILED RECEIPT */
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4 my-2 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase border border-emerald-200">
                Official Report Filed
              </span>
              <h4 className="font-black text-slate-900 text-base mt-2">{filedReport.reportId}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Escalated to: <strong>{filedReport.authorityTarget}</strong></p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Item / Trip:</span>
                <span className="font-bold text-slate-900">{filedReport.itemOrTripName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Offender / Shop:</span>
                <span className="font-bold text-slate-900">{filedReport.sellerOrDriverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quoted vs Fair Max:</span>
                <span className="font-bold text-rose-600">₹{filedReport.quotedPrice} vs ₹{filedReport.fairPriceMax} (+{filedReport.priceDeltaPercent}%)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs"
            >
              Done & Close
            </button>
          </div>
        ) : (
          /* FORM */
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Violation Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-semibold"
              >
                <option value="product_overcharging">Product Price Overcharging / Price Gouging</option>
                <option value="rickshaw_meter_refusal">Auto-Rickshaw Meter Refusal / Flat Rate Extortion</option>
                <option value="mrp_violation">MRP Violation (Charging Above Printed Package MRP)</option>
                <option value="false_warranty">False Official Warranty Claim</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product / Trip Name</label>
                <input
                  type="text"
                  value={itemOrTripName}
                  onChange={(e) => setItemOrTripName(e.target.value)}
                  placeholder="e.g. Wireless Headphones / Rickshaw Trip"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Offender Name / Driver</label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="e.g. City Electronics / Vehicle MH-15-AB-1234"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Quoted Price (₹)</label>
                <input
                  type="number"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-rose-300 bg-rose-50/50 font-bold text-rose-900 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-emerald-700 mb-1">Fair Price Max (₹)</label>
                <input
                  type="number"
                  value={fairPriceMax}
                  onChange={(e) => setFairPriceMax(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/50 font-bold text-emerald-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Address or Vehicle Reg Number</label>
              <input
                type="text"
                value={shopAddressOrVehicle}
                onChange={(e) => setShopAddressOrVehicle(e.target.value)}
                placeholder="e.g. Shop 4, College Road Market, Nashik or Vehicle MH-15-BX-4921"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence & Incident Notes</label>
              <textarea
                rows={3}
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                placeholder="Detail what happened (e.g. Shopkeeper refused bill, demanded ₹450 over ₹300 MRP, or driver refused meter)..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800 flex items-center gap-2">
              <Scale className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Report will be automatically logged and escalated to the <strong>Legal Metrology Inspectorate & RTO Enforcement Cell</strong> in {location.city}.
              </span>
            </div>

            <div className="flex gap-2 pt-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Filing Report...' : 'File Official Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
