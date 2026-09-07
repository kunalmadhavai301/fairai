import axios from 'axios';
import {
  ProductAnalysisFull,
  LocationInfo,
  AppSettings,
  RickshawFareAnalysis,
  OverchargingReport,
  Pujari,
  Driver,
  Hotel,
  KumbhLocation,
  TripPlan,
  KitItem,
} from '../types';

const API_BASE = '/api';

export const apiClient = {
  async identifyProduct(data: { query?: string; barcode?: string; category?: string }) {
    const res = await axios.post(`${API_BASE}/products/identify`, data);
    return res.data.product;
  },

  async analyzeProduct(payload: {
    productName?: string;
    brand?: string;
    model?: string;
    category?: string;
    quotedPrice: number;
    location?: LocationInfo;
    barcode?: string;
    specifications?: { name: string; value: string }[];
    imageBuffer?: string;
  }): Promise<ProductAnalysisFull> {
    const res = await axios.post(`${API_BASE}/products/analyze`, payload);
    return res.data.data;
  },

  async getPujaris(ghat?: string): Promise<Pujari[]> {
    const res = await axios.get(`${API_BASE}/kumbh/pujaris`, { params: { ghat } });
    return res.data.data;
  },

  async getDrivers(): Promise<Driver[]> {
    const res = await axios.get(`${API_BASE}/kumbh/transport`);
    return res.data.data;
  },

  async getHotels(budget?: string, familyOnly?: boolean): Promise<Hotel[]> {
    const res = await axios.get(`${API_BASE}/kumbh/hotels`, { params: { budget, familyOnly } });
    return res.data.data;
  },

  async getKumbhExplore(type?: string): Promise<KumbhLocation[]> {
    const res = await axios.get(`${API_BASE}/kumbh/explore`, { params: { type } });
    return res.data.data;
  },

  async planTrip(payload: {
    adults: number;
    children: number;
    days: number;
    budget: number;
    travelStyle?: string;
    interests?: string[];
    hasElderly?: boolean;
  }): Promise<TripPlan> {
    const res = await axios.post(`${API_BASE}/kumbh/plan-trip`, payload);
    return res.data.data;
  },

  async planKit(days?: number, groupSize?: number): Promise<KitItem[]> {
    const res = await axios.post(`${API_BASE}/kumbh/plan-kit`, { days, groupSize });
    return res.data.data;
  },

  async calculateEffectiveCost(payload: {
    productPrice: number;
    sellerDistanceKm: number;
    transportMode?: string;
    alternativePrice?: number;
    alternativeDistanceKm?: number;
  }) {
    const res = await axios.post(`${API_BASE}/kumbh/effective-cost`, payload);
    return res.data.data;
  },

  async calculateRickshawFare(payload: {
    pickup: string;
    dropoff: string;
    distanceKm: number;
    driverQuotedFare: number;
    isNightTariff?: boolean;
    location?: LocationInfo;
  }): Promise<RickshawFareAnalysis> {
    const res = await axios.post(`${API_BASE}/rickshaw/fare`, payload);
    return res.data.data;
  },

  async submitReport(payload: {
    itemOrTripName: string;
    reportType: 'product_overcharging' | 'rickshaw_meter_refusal' | 'mrp_violation' | 'false_warranty';
    quotedPrice: number;
    fairPriceMax: number;
    sellerOrDriverName: string;
    shopAddressOrVehicleNo: string;
    city: string;
    evidenceNotes?: string;
  }): Promise<OverchargingReport> {
    const res = await axios.post(`${API_BASE}/reports/submit`, payload);
    return res.data.report;
  },

  async getReports(): Promise<OverchargingReport[]> {
    const res = await axios.get(`${API_BASE}/reports`);
    return res.data.reports;
  },

  async getHistory(): Promise<ProductAnalysisFull[]> {
    const res = await axios.get(`${API_BASE}/history`);
    return res.data.data;
  },

  async getAdminStats() {
    const res = await axios.get(`${API_BASE}/admin/stats`);
    return res.data.stats;
  },

  async importAdminData(records: any[]) {
    const res = await axios.post(`${API_BASE}/admin/import`, { records });
    return res.data.data;
  },

  async reverseGeocode(lat?: number, lng?: number, city?: string, state?: string): Promise<LocationInfo> {
    const res = await axios.post(`${API_BASE}/location/reverse-geocode`, {
      latitude: lat,
      longitude: lng,
      city,
      state,
    });
    return res.data.location;
  },

  async sendChatMessage(question: string, activeAnalysisId?: string): Promise<string> {
    const res = await axios.post(`${API_BASE}/chat`, { question, activeAnalysisId });
    return res.data.answer;
  },

  async processRequirement(query: string, quotedPrice?: number) {
    const res = await axios.post(`${API_BASE}/recommendations`, { query, quotedPrice });
    return res.data.data;
  },

  async getSettings(): Promise<AppSettings> {
    const res = await axios.get(`${API_BASE}/settings`);
    return res.data.settings;
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await axios.put(`${API_BASE}/settings`, settings);
    return res.data.settings;
  },
};
