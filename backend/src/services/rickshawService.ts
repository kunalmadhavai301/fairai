import { RickshawFareAnalysis, LocationInfo } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class RickshawFareService {
  /**
   * Calculates official city auto-rickshaw meter fare vs driver quoted price
   * for cities like Nashik, Mumbai, Pune, Delhi, Bengaluru.
   */
  public calculateRickshawFare(params: {
    pickup: string;
    dropoff: string;
    distanceKm: number;
    driverQuotedFare: number;
    isNightTariff?: boolean;
    location: LocationInfo;
  }): RickshawFareAnalysis {
    const { pickup, dropoff, distanceKm, driverQuotedFare, isNightTariff = false, location } = params;

    const city = location.city || 'Nashik';

    // Official meter rates (approximate RTO city tariffs)
    let baseFare = 23; // First 1.5 km
    let baseDistanceKm = 1.5;
    let ratePerKm = 15.5; // per subsequent km

    if (city.toLowerCase().includes('mumbai')) {
      baseFare = 23;
      ratePerKm = 15.33;
    } else if (city.toLowerCase().includes('pune')) {
      baseFare = 25;
      ratePerKm = 17;
    } else if (city.toLowerCase().includes('bengaluru') || city.toLowerCase().includes('bangalore')) {
      baseFare = 30;
      baseDistanceKm = 2.0;
      ratePerKm = 15;
    } else if (city.toLowerCase().includes('delhi')) {
      baseFare = 30;
      baseDistanceKm = 1.5;
      ratePerKm = 11;
    }

    // Compute base official distance fare
    let calculatedMeter = baseFare;
    if (distanceKm > baseDistanceKm) {
      calculatedMeter += (distanceKm - baseDistanceKm) * ratePerKm;
    }

    // Apply Night Tariff multiplier (+25% between 11 PM and 5 AM) if checked
    if (isNightTariff) {
      calculatedMeter *= 1.25;
    }

    const officialMeterFare = Math.round(calculatedMeter);
    const fairFareRangeMin = Math.round(officialMeterFare * 0.95);
    const fairFareRangeMax = Math.round(officialMeterFare * 1.15); // Local buffer

    const fareDeltaPercent = Math.round(((driverQuotedFare - officialMeterFare) / officialMeterFare) * 100 * 10) / 10;

    let status: 'FAIR_METER' | 'SLIGHT_EXTRA' | 'OVERCHARGING' | 'EXTORTIONATE';
    let statusLabel: string;
    let recommendation: 'ACCEPT_FARE' | 'LOOK_FOR_OTHER_RIDE' | 'TAKE_SHARED_OR_APP';

    if (driverQuotedFare <= fairFareRangeMax) {
      status = 'FAIR_METER';
      statusLabel = '✓ FAIR METER FARE';
      recommendation = 'ACCEPT_FARE';
    } else if (fareDeltaPercent <= 30) {
      status = 'SLIGHT_EXTRA';
      statusLabel = '⚠ SLIGHTLY ABOVE METER (₹' + (driverQuotedFare - officialMeterFare) + ' Extra)';
      recommendation = 'LOOK_FOR_OTHER_RIDE';
    } else if (fareDeltaPercent <= 70) {
      status = 'OVERCHARGING';
      statusLabel = '⚠ OVERCHARGING (+ ' + fareDeltaPercent + '%)';
      recommendation = 'LOOK_FOR_OTHER_RIDE';
    } else {
      status = 'EXTORTIONATE';
      statusLabel = '🚨 EXTORTIONATE FARE (+ ' + fareDeltaPercent + '%)';
      recommendation = 'TAKE_SHARED_OR_APP';
    }

    // Fairness score (0-100)
    let fairnessScore = 100;
    if (driverQuotedFare <= officialMeterFare) fairnessScore = 98;
    else if (driverQuotedFare <= fairFareRangeMax) fairnessScore = 88;
    else fairnessScore = Math.max(10, Math.round(85 - (fareDeltaPercent - 15) * 1.2));

    const localTips = [
      `Official ${city} RTO base meter is ₹${baseFare} for first ${baseDistanceKm}km, then ₹${ratePerKm}/km.`,
      isNightTariff ? 'Night tariff applies (+25% official surcharge between 11 PM – 5 AM).' : 'Daytime trip: insist on official meter rate.',
      `Official estimated meter range: ₹${officialMeterFare} – ₹${fairFareRangeMax}.`,
      'If driver refuses meter, try booking Uber Auto / Rapido / Ola Auto or look for shared rickshaw stand nearby.',
    ];

    return {
      id: `rickshaw-${uuidv4().substring(0, 8)}`,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      distanceKm,
      isNightTariff,
      city,
      baseFare,
      ratePerKm,
      officialMeterFare,
      driverQuotedFare,
      fairFareRangeMin,
      fairFareRangeMax,
      fairnessScore,
      status,
      statusLabel,
      fareDeltaPercent,
      recommendation,
      localTips,
    };
  }
}

export const rickshawService = new RickshawFareService();
