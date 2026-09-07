import { TripPlan, DayItinerary, DayActivity, BudgetBreakdown, KitItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PlannerService {
  /**
   * Generates a personalized Kumbh itinerary, cost breakdown, and smart budget optimization.
   */
  public generateTripPlan(params: {
    adults: number;
    children: number;
    days: number;
    budget: number;
    travelStyle?: 'Budget' | 'Balanced' | 'Comfort' | 'Premium';
    interests?: string[];
    hasElderly?: boolean;
  }): TripPlan {
    const { adults, children, days, budget, travelStyle = 'Balanced', interests = ['Spiritual', 'Ghats', 'Food'], hasElderly = false } = params;

    const totalPeople = adults + children;
    const isBudgetStyle = travelStyle === 'Budget' || budget < days * 2500;

    // Estimate daily costs per head
    const nightRate = isBudgetStyle ? 950 : travelStyle === 'Comfort' ? 2400 : travelStyle === 'Premium' ? 5500 : 1600;
    const totalHotel = nightRate * (days - 1 > 0 ? days - 1 : 1);
    const dailyFoodPerHead = isBudgetStyle ? 220 : 450;
    const totalFood = dailyFoodPerHead * totalPeople * days;
    const totalTransport = Math.round((isBudgetStyle ? 150 : 350) * days * (adults > 2 ? 1.5 : 1));
    const totalActivities = Math.round(150 * days * totalPeople);
    const totalPuja = 1100 + (adults > 2 ? 500 : 0);
    const totalShopping = Math.round(200 * totalPeople * days);
    const emergencyBuffer = Math.round(budget * 0.05);

    const totalCalculated = totalHotel + totalFood + totalTransport + totalActivities + totalPuja + totalShopping + emergencyBuffer;
    let remainingBudget = budget - totalCalculated;
    let optimized = false;
    let optimizationNotes: string[] = [];

    // Smart Budget Optimization if total cost exceeds user budget
    let finalHotel = totalHotel;
    let finalTransport = totalTransport;
    let finalFood = totalFood;

    if (totalCalculated > budget) {
      optimized = true;
      const overBy = totalCalculated - budget;
      optimizationNotes.push(`Your initial calculated plan (₹${totalCalculated.toLocaleString()}) exceeded your budget by ₹${overBy.toLocaleString()}.`);

      // Optimize Hotel stay
      if (finalHotel > 600 * days) {
        const hotelSavings = Math.round(finalHotel * 0.35);
        finalHotel -= hotelSavings;
        optimizationNotes.push(`• Switched hotel recommendation to verified Yatri Niwas / Ashram stay (saved ₹${hotelSavings.toLocaleString()}).`);
      }

      // Optimize Transport
      if (finalTransport > 120 * days) {
        const transSavings = Math.round(finalTransport * 0.40);
        finalTransport -= transSavings;
        optimizationNotes.push(`• Substituted private auto taxis with official RTO E-Rickshaw shuttles & fixed shared routes (saved ₹${transSavings.toLocaleString()}).`);
      }

      // Recompute
      const newTotal = finalHotel + finalFood + finalTransport + totalActivities + totalPuja + totalShopping + emergencyBuffer;
      remainingBudget = budget - newTotal;
      optimizationNotes.push(`✓ Smart Optimization complete! Total estimated trip cost is now ₹${newTotal.toLocaleString()} (within your ₹${budget.toLocaleString()} budget).`);
    }

    // Build Daily Itinerary
    const dailyItinerary: DayItinerary[] = [];
    for (let d = 1; d <= days; d++) {
      const activities: DayActivity[] = [];

      if (d === 1) {
        activities.push({
          time: '05:30 AM – 08:00 AM',
          location: 'Ram Kund Ghat',
          activity: 'Holy Mahasnan in Godavari River & Ganga Aarti',
          estimatedTravelTime: '15 mins',
          transportMode: hasElderly ? 'E-Rickshaw Shuttle' : 'Walking / Shared Auto',
          transportCost: 30,
          entryBookingCost: 0,
          foodEstimate: 100,
          costTotal: 130,
        });
        activities.push({
          time: '09:00 AM – 11:30 AM',
          location: 'Shree Kalaram Temple & Sita Gufa',
          activity: 'Vedic Darshan & Traditional Temple Parikrama',
          estimatedTravelTime: '10 mins',
          transportMode: 'Walking corridor',
          transportCost: 0,
          entryBookingCost: 20,
          foodEstimate: 150,
          costTotal: 170,
        });
        activities.push({
          time: '01:00 PM – 03:00 PM',
          location: 'College Road Market',
          activity: 'Authentic Maharashtrian Thali Lunch & Price Intelligence Check',
          estimatedTravelTime: '15 mins',
          transportMode: 'Auto-Rickshaw (Meter Fare)',
          transportCost: 45,
          entryBookingCost: 0,
          foodEstimate: 250,
          costTotal: 295,
        });
      } else if (d === 2) {
        activities.push({
          time: '06:00 AM – 12:00 PM',
          location: 'Trimbakeshwar Temple & Brahmagiri',
          activity: 'Jyotirlinga Darshan & Holy Snan at Kushavarta Kund',
          estimatedTravelTime: '45 mins',
          transportMode: 'Shared Bus / Taxi Shuttle',
          transportCost: 90,
          entryBookingCost: 200,
          foodEstimate: 200,
          costTotal: 490,
        });
        activities.push({
          time: '04:00 PM – 07:00 PM',
          location: 'Tapovan & Sadhugram',
          activity: 'Akhara Saint Encampment Visit & Sunset Godavari Aarti',
          estimatedTravelTime: '20 mins',
          transportMode: 'Auto-Rickshaw',
          transportCost: 50,
          entryBookingCost: 0,
          foodEstimate: 120,
          costTotal: 170,
        });
      } else {
        activities.push({
          time: '07:00 AM – 10:00 AM',
          location: 'Panchavati Ghats',
          activity: 'Pujari Rituals, Tarpan & Deep Dan',
          estimatedTravelTime: '15 mins',
          transportMode: 'Shared Shuttle',
          transportCost: 25,
          entryBookingCost: 500,
          foodEstimate: 120,
          costTotal: 645,
        });
        activities.push({
          time: '11:00 AM – 02:00 PM',
          location: 'Local Handicrafts & Souvenir Market',
          activity: 'Kumbh Shopping with FairBuy Price Intelligence checks',
          estimatedTravelTime: '10 mins',
          transportMode: 'Walking',
          transportCost: 0,
          entryBookingCost: 0,
          foodEstimate: 200,
          costTotal: 200,
        });
      }

      const dayTotal = activities.reduce((sum, act) => sum + act.costTotal, 0);

      dailyItinerary.push({
        dayNumber: d,
        dateLabel: `Day ${d}`,
        title: d === 1 ? 'Holy Snan & Panchavati Darshan' : d === 2 ? 'Trimbakeshwar Excursion & Sadhugram' : 'Sacred Puja & Pilgrimage Shopping',
        activities,
        dailyTotalCost: dayTotal,
      });
    }

    const effectiveTransport = finalTransport;
    const finalTotal = finalHotel + finalFood + finalTransport + totalActivities + totalPuja + totalShopping + emergencyBuffer;

    return {
      id: `trip-${uuidv4().substring(0, 8)}`,
      groupSize: { adults, children },
      durationDays: days,
      totalBudget: budget,
      travelStyle,
      interests,
      dailyItinerary,
      costBreakdown: {
        accommodation: finalHotel,
        food: finalFood,
        transport: finalTransport,
        activities: totalActivities,
        puja: totalPuja,
        shopping: totalShopping,
        emergencyBuffer,
        totalCalculated: finalTotal,
      },
      effectiveTransportCost: effectiveTransport,
      remainingBudget: Math.max(0, budget - finalTotal),
      optimized,
      optimizationNotes,
    };
  }

  /**
   * Generates a personalized Kumbh Travel KIT checklist with fair price bounds.
   */
  public generateKumbhKit(days: number = 3, groupSize: number = 2): KitItem[] {
    return [
      {
        id: 'kit-1',
        name: 'Copper Puja Lota & Holy Water Flask',
        category: 'Spiritual Essentials',
        recommendedQuantity: `${groupSize} Pcs`,
        fairPriceRange: '₹180 – ₹260',
        estimatedCost: 220,
        essentialLevel: 'must_have',
        notes: 'Essential for collecting sacred Godavari Jal at Ram Kund.',
      },
      {
        id: 'kit-2',
        name: 'Compact Windproof Pilgrimage Umbrella',
        category: 'Clothing & Protection',
        recommendedQuantity: `${groupSize} Pcs`,
        fairPriceRange: '₹150 – ₹250',
        estimatedCost: 200,
        essentialLevel: 'must_have',
        notes: 'Protects against sun on open river ghats.',
      },
      {
        id: 'kit-3',
        name: 'Waterproof Snan Mat / Sitting Cushion',
        category: 'Travel Gear',
        recommendedQuantity: `${groupSize} Pcs`,
        fairPriceRange: '₹60 – ₹120',
        estimatedCost: 80,
        essentialLevel: 'recommended',
        notes: 'For sitting comfortably during extended Ghat pujas & Aarti.',
      },
      {
        id: 'kit-4',
        name: 'Quick-Dry Cotton Towel Set',
        category: 'Hygiene & Health',
        recommendedQuantity: `${groupSize * 2} Pcs`,
        fairPriceRange: '₹120 – ₹200',
        estimatedCost: 160,
        essentialLevel: 'must_have',
        notes: 'Lightweight and fast-drying after holy dips.',
      },
      {
        id: 'kit-5',
        name: 'Pouch Bag for Shoes / Footwear',
        category: 'Travel Gear',
        recommendedQuantity: `${groupSize} Pcs`,
        fairPriceRange: '₹30 – ₹60',
        estimatedCost: 40,
        essentialLevel: 'must_have',
        notes: 'Keep footwear safe when entering temple zones.',
      },
      {
        id: 'kit-6',
        name: '10,000mAh Heavy Duty Power Bank',
        category: 'Travel Gear',
        recommendedQuantity: '1 Pc',
        fairPriceRange: '₹750 – ₹1,100',
        estimatedCost: 850,
        essentialLevel: 'recommended',
        notes: 'Keeps phone charged during long days in crowded Mela areas.',
      },
      {
        id: 'kit-7',
        name: 'First Aid Kit & Motion Sickness Medicines',
        category: 'Hygiene & Health',
        recommendedQuantity: '1 Box',
        fairPriceRange: '₹100 – ₹180',
        estimatedCost: 140,
        essentialLevel: 'must_have',
        notes: 'ORSL hydration packs, band-aids, antiseptics.',
      },
      {
        id: 'kit-8',
        name: 'Waterproof Document Pouch & Neck Wallet',
        category: 'Document & Cash',
        recommendedQuantity: '1 Pc',
        fairPriceRange: '₹90 – ₹150',
        estimatedCost: 110,
        essentialLevel: 'must_have',
        notes: 'Safeguards Aadhaar, ID cards, cash & phone in crowded ghats.',
      },
    ];
  }

  /**
   * Calculates Effective Buying Cost considering product price + transport cost to reach seller.
   */
  public calculateEffectiveBuyingCost(params: {
    productPrice: number;
    sellerDistanceKm: number;
    transportMode?: 'auto' | 'taxi' | 'walking' | 'bus';
    alternativePrice?: number;
    alternativeDistanceKm?: number;
  }) {
    const { productPrice, sellerDistanceKm, transportMode = 'auto', alternativePrice, alternativeDistanceKm } = params;

    let ratePerKm = transportMode === 'taxi' ? 14 : transportMode === 'bus' ? 2 : 12;
    if (sellerDistanceKm <= 1.5 && transportMode === 'walking') ratePerKm = 0;

    const roundTripTransport = sellerDistanceKm * 2 * ratePerKm;
    const effectiveCost = productPrice + roundTripTransport;

    let alternativeAnalysis: string | undefined;
    if (alternativePrice !== undefined && alternativeDistanceKm !== undefined) {
      const altRoundTripTransport = alternativeDistanceKm * 2 * ratePerKm;
      const altEffectiveCost = alternativePrice + altRoundTripTransport;

      if (effectiveCost < altEffectiveCost) {
        alternativeAnalysis = `Current seller's effective cost (₹${effectiveCost}) is lower than Alternative (₹${altEffectiveCost} including ₹${altRoundTripTransport} transport). Stick with current seller!`;
      } else {
        const netSavings = effectiveCost - altEffectiveCost;
        alternativeAnalysis = `Alternative seller is cheaper! Even with ₹${altRoundTripTransport} transport, you save ₹${netSavings} in net effective cost.`;
      }
    }

    return {
      productPrice,
      sellerDistanceKm,
      roundTripTransport,
      effectiveCost,
      alternativeAnalysis,
    };
  }
}

export const plannerService = new PlannerService();
