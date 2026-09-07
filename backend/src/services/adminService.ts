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
  private addedEntries: any[] = [
    {
      id: 'adm-1',
      category: 'Food & Dining',
      name: 'Shree Ram Mahaprasad Thali',
      description: 'Unlimited traditional Mahaprasad thali near Ram Kund Ghat',
      price: 120,
      phone: '+91 98220 11223',
      location: 'Panchavati, Nashik',
      verificationStatus: 'Verified',
      rating: 4.9,
      dateAdded: new Date().toLocaleDateString(),
    },
    {
      id: 'adm-2',
      category: 'Travel & Transport',
      name: 'Nashik Station Auto Shuttle Service',
      description: 'Fixed rate RTO approved auto shuttle from Railway station to Ghats',
      price: 60,
      phone: '+91 98220 33445',
      location: 'Nashik Road Station',
      verificationStatus: 'Official Source',
      rating: 4.8,
      dateAdded: new Date().toLocaleDateString(),
    },
    {
      id: 'adm-3',
      category: 'Pujari & Rituals',
      name: 'Godavari Mahasnan & Pitri Tarpan Rituals',
      description: 'Vedic pujari services at Ram Kund & Panchavati Ghats',
      price: 501,
      phone: '+91 98220 55667',
      location: 'Ram Kund Ghat, Nashik',
      verificationStatus: 'Verified',
      rating: 5.0,
      dateAdded: new Date().toLocaleDateString(),
    },
  ];

  /**
   * Imports bulk or single records into FairBuy knowledge base.
   */
  public importBulkData(records: any[]): { importedCount: number; validCount: number; reviewCount: number; entries: any[] } {
    let validCount = 0;
    let reviewCount = 0;

    records.forEach((record) => {
      if (record.name || record.driverName || record.productName || record.title) {
        validCount++;
        this.addedEntries.unshift({
          id: `adm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          category: record.category || 'Products & Shopping',
          name: record.name || record.productName || record.driverName || record.title || 'Custom Service Entry',
          description: record.description || record.details || 'Verified local service entry',
          price: Number(record.price || record.quotedPrice) || 150,
          phone: record.phone || record.contact || '+91 98220 00000',
          location: record.location || record.city || 'Nashik',
          verificationStatus: record.verificationStatus || 'Verified',
          rating: Number(record.rating) || 4.8,
          dateAdded: new Date().toLocaleDateString(),
        });
      } else {
        reviewCount++;
      }
    });

    return {
      importedCount: records.length,
      validCount,
      reviewCount,
      entries: this.addedEntries,
    };
  }

  public getAddedEntries(): any[] {
    return this.addedEntries;
  }

  public getStats(): AdminStats {
    const verifiedCount = 28 + this.addedEntries.filter((e) => e.verificationStatus === 'Verified').length;
    return {
      productsCount: 42 + this.addedEntries.filter((e) => e.category === 'Products & Shopping').length,
      pricesCount: 185 + this.addedEntries.length,
      pujarisCount: 10 + this.addedEntries.filter((e) => e.category === 'Pujari & Rituals').length,
      driversCount: 10 + this.addedEntries.filter((e) => e.category === 'Travel & Transport').length,
      hotelsCount: 10 + this.addedEntries.filter((e) => e.category === 'Hotels & Lodging').length,
      verifiedCount,
      communityRatedCount: 35 + this.addedEntries.length,
      modelMetrics: predictivePricingService.getModelMetrics(),
      eventConfig: predictivePricingService.getEventConfig(),
    };
  }
}

export const adminService = new AdminService();
