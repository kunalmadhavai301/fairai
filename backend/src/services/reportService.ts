import { OverchargingReport } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ReportService {
  private reportsStore: OverchargingReport[] = [
    {
      reportId: 'REPORT-FB-2026-8941',
      itemOrTripName: 'Auto-Rickshaw Trip (Station to College Road)',
      reportType: 'rickshaw_meter_refusal',
      quotedPrice: 150,
      fairPriceMax: 70,
      priceDeltaPercent: 114.2,
      sellerOrDriverName: 'MH-15 Auto Driver (MH-15-BX-4921)',
      shopAddressOrVehicleNo: 'MH-15-BX-4921 (Nashik Station Auto Stand)',
      city: 'Nashik',
      evidenceNotes: 'Driver refused meter fare of ₹70 and demanded ₹150 flat rate.',
      authorityTarget: 'RTO Regional Transport Department & Nashik Traffic Police',
      status: 'NOTICE_ISSUED',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      reportId: 'REPORT-FB-2026-7230',
      itemOrTripName: 'Anker PowerLine III 60W USB-C Cable',
      reportType: 'product_overcharging',
      quotedPrice: 450,
      fairPriceMax: 320,
      priceDeltaPercent: 57.8,
      sellerOrDriverName: 'Sharanpur Electronics Mart',
      shopAddressOrVehicleNo: 'Shop 12, Sharanpur Road, Nashik',
      city: 'Nashik',
      evidenceNotes: 'Shopkeeper quoted ₹450 for cable with fair market price range of ₹250–₹320.',
      authorityTarget: 'Legal Metrology Department & Consumer Disputes Redressal Commission',
      status: 'UNDER_INVESTIGATION',
      timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ];

  /**
   * Submits a formal overcharging or MRP violation report to Consumer Action Zone.
   */
  public submitReport(params: {
    itemOrTripName: string;
    reportType: 'product_overcharging' | 'rickshaw_meter_refusal' | 'mrp_violation' | 'false_warranty';
    quotedPrice: number;
    fairPriceMax: number;
    sellerOrDriverName: string;
    shopAddressOrVehicleNo: string;
    city: string;
    evidenceNotes?: string;
  }): OverchargingReport {
    const { itemOrTripName, reportType, quotedPrice, fairPriceMax, sellerOrDriverName, shopAddressOrVehicleNo, city, evidenceNotes } = params;

    const deltaPct = Math.round(((quotedPrice - fairPriceMax) / fairPriceMax) * 100 * 10) / 10;

    let authorityTarget = 'Legal Metrology Department & Consumer Disputes Redressal Forum';
    if (reportType === 'rickshaw_meter_refusal') {
      authorityTarget = `${city} RTO Transport Authority & Local Traffic Police`;
    } else if (reportType === 'mrp_violation') {
      authorityTarget = 'Inspectorate of Legal Metrology & Weights and Measures';
    }

    const newReport: OverchargingReport = {
      reportId: `REPORT-FB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      itemOrTripName,
      reportType,
      quotedPrice,
      fairPriceMax,
      priceDeltaPercent: deltaPct,
      sellerOrDriverName: sellerOrDriverName || 'Local Unregistered Seller',
      shopAddressOrVehicleNo: shopAddressOrVehicleNo || `${city} Local Market`,
      city,
      evidenceNotes: evidenceNotes || 'Quoted price significantly exceeds verified fair market bounds.',
      authorityTarget,
      status: 'FILED',
      timestamp: new Date().toISOString(),
    };

    this.reportsStore.unshift(newReport);
    return newReport;
  }

  public getAllReports(): OverchargingReport[] {
    return this.reportsStore;
  }

  public getReportById(id: string): OverchargingReport | undefined {
    return this.reportsStore.find((r) => r.reportId === id);
  }
}

export const reportService = new ReportService();
