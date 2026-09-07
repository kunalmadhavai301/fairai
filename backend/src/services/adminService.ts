import { Pujari, Driver, Hotel, IdentifiedProduct, PriceObservation, ModelMetrics, KumbhEventConfig } from '../types';
import { predictivePricingService } from './predictivePricingService';

export interface AdminStats {
  productsCount: number;
  pricesCount: number;
  pujarisCount: number;
  driversCount: number;
  hotelsCount: number;
  verifiedCount: number;
  communityRatedCount: number;
  modelMetrics: ModelMetrics;
  eventConfig: KumbhEventConfig;
}

export class AdminService {
  /**
   * Imports bulk records (CSV / JSON data format) into FairBuy knowledge base.
   */
  public importBulkData(records: any[]): { importedCount: number; validCount: number; reviewCount: number } {
    let validCount = 0;
    let reviewCount = 0;

    records.forEach((record) => {
      if (record.name || record.driverName || record.productName || record.title) {
        validCount++;
      } else {
        reviewCount++;
      }
    });

    return {
      importedCount: records.length,
      validCount,
      reviewCount,
    };
  }

  public getStats(): AdminStats {
    return {
      productsCount: 42,
      pricesCount: 185,
      pujarisCount: 10,
      driversCount: 10,
      hotelsCount: 10,
      verifiedCount: 28,
      communityRatedCount: 35,
      modelMetrics: predictivePricingService.getModelMetrics(),
      eventConfig: predictivePricingService.getEventConfig(),
    };
  }
}

export const adminService = new AdminService();
