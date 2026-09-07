import { LocationInfo } from '../types';

export interface KumbhLandmark {
  id: string;
  name: string;
  category: 'ghat' | 'temple' | 'station' | 'market';
  latitude: number;
  longitude: number;
  description: string;
}

export const KUMBH_LANDMARKS: KumbhLandmark[] = [
  { id: 'ram-kund', name: 'Ram Kund Ghat', category: 'ghat', latitude: 20.0063, longitude: 73.7915, description: 'Holy bathing ghat on river Godavari' },
  { id: 'trimbakeshwar', name: 'Trimbakeshwar Ghat & Temple', category: 'temple', latitude: 19.9320, longitude: 73.5300, description: 'Ancient Jyotirlinga temple and sacred bathing site' },
  { id: 'panchavati', name: 'Panchavati Godavari Ghat', category: 'ghat', latitude: 20.0080, longitude: 73.7925, description: 'Spiritual river bank in central Panchavati' },
  { id: 'tapovan', name: 'Tapovan Sacred Forest Ghat', category: 'ghat', latitude: 20.0020, longitude: 73.8050, description: 'Serene meditative forest & bathing ghat' },
  { id: 'kalaram', name: 'Kalaram Mandir', category: 'temple', latitude: 20.0070, longitude: 73.7940, description: 'Historic black stone Lord Ram temple' },
  { id: 'nashik-station', name: 'Nashik Road Railway Station', category: 'station', latitude: 19.9530, longitude: 73.8320, description: 'Main railway junction connecting Nashik' },
  { id: 'college-road', name: 'College Road Shopping Hub', category: 'market', latitude: 19.9975, longitude: 73.7898, description: 'Popular shopping, dining & market area' },
];

export class LocationService {
  /**
   * Reverse geocodes coordinates or returns default location context.
   */
  public reverseGeocode(latitude?: number, longitude?: number): LocationInfo {
    if (latitude && longitude) {
      if (latitude >= 19.8 && latitude <= 20.2 && longitude >= 73.4 && longitude <= 74.0) {
        return {
          latitude,
          longitude,
          city: 'Nashik',
          state: 'Maharashtra',
          country: 'India',
          locality: 'Panchavati / Ghat Region',
          source: 'device',
          formatted: 'Nashik, Maharashtra',
        };
      } else if (latitude >= 18.9 && latitude <= 19.3) {
        return {
          latitude,
          longitude,
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          locality: 'Bandra Market',
          source: 'device',
          formatted: 'Mumbai, Maharashtra',
        };
      }
    }

    return {
      latitude: 19.9975,
      longitude: 73.7898,
      city: 'Nashik',
      state: 'Maharashtra',
      country: 'India',
      locality: 'College Road',
      source: 'default',
      formatted: 'Nashik, Maharashtra',
    };
  }

  public setManualLocation(city: string, state: string, locality?: string): LocationInfo {
    return {
      city,
      state,
      country: 'India',
      locality,
      source: 'manual',
      formatted: `${city}, ${state}`,
    };
  }

  /**
   * Calculates Haversine distance in km between two coordinate pairs.
   */
  public calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return Math.round(dist * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Calculates distance from user location (or default origin) to a destination landmark.
   */
  public calculateRouteToLandmark(
    originLat?: number,
    originLon?: number,
    destinationId?: string
  ): { destination: KumbhLandmark; distanceKm: number } {
    const origLat = originLat || 19.9975;
    const origLon = originLon || 73.7898;

    const landmark = KUMBH_LANDMARKS.find((l) => l.id === destinationId) || KUMBH_LANDMARKS[0]; // Ram Kund
    const distanceKm = this.calculateHaversineDistance(origLat, origLon, landmark.latitude, landmark.longitude);

    return {
      destination: landmark,
      distanceKm: Math.max(0.8, distanceKm),
    };
  }
}

export const locationService = new LocationService();
