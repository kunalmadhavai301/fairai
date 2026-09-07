export interface LocationInfo {
  latitude?: number;
  longitude?: number;
  city: string;
  state: string;
  country: string;
  locality?: string;
  source: 'device' | 'manual' | 'default';
  formatted: string;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface IdentifiedProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  imageUrl?: string;
  specifications: ProductSpecification[];
  confidence: number;
  description?: string;
}

export interface RetailerStoreOption {
  id: string;
  storeName: string;
  storeLogoUrl: string;
  channelType: 'online' | 'local_store' | 'authorized_dealer';
  price: number;
  currency: string;
  availability: 'In Stock' | 'Limited Stock' | 'Fast Delivery';
  location: string;
  warranty: string;
  storeUrl?: string;
}

export interface PriceObservation {
  id: string;
  productId: string;
  seller: string;
  source: string;
  sourceType: 'online' | 'local_store' | 'marketplace' | 'authorized_dealer';
  price: number;
  currency: string;
  location: string;
  availability: 'in_stock' | 'limited' | 'out_of_stock';
  condition: 'new' | 'refurbished' | 'open_box';
  warranty: string;
  shipping: number;
  timestamp: string;
  sourceUrl?: string;
  isLive: boolean;
}

export interface ProductMatchDetails {
  categoryMatched: boolean;
  brandDetected: boolean;
  modelDetected: boolean;
  specsMatched: boolean;
  webVerified: boolean;
  detectedCategory?: string;
  detectedBrand?: string;
  detectedModel?: string;
  detectedSpecs?: ProductSpecification[];
  visibleText?: string[];
  candidateMatches?: { name: string; brand: string; model: string; category: string }[];
}

export interface ConfidenceBreakdown {
  productMatchScore: number;
  productMatchLevel: 'High confidence' | 'Moderate confidence' | 'Low / Uncertain';
  productDetails: ProductMatchDetails;
  priceDataScore: number;
  priceDataLevel: 'High confidence' | 'Good confidence' | 'Low confidence';
  reviewScore: number;
  reviewLevel: 'High confidence' | 'Moderate confidence' | 'Limited evidence';
  decisionScore: number;
  decisionLevel: 'High confidence' | 'Good confidence' | 'Moderate confidence' | 'Low confidence';
  weights: {
    product: number;
    price: number;
    review: number;
    freshness: number;
    agreement: number;
  };
  explanationNotes: string[];
}

export interface PriceContextKumbh {
  normalMarketMin: number;
  normalMarketMax: number;
  kumbhAreaMin: number;
  kumbhAreaMax: number;
  kumbhSurgePercent: number;
  explanation: string;
}

export interface PriceFairnessResult {
  sellerPrice: number;
  fairPriceMin: number;
  fairPriceMax: number;
  marketMedian: number;
  marketAverage: number;
  lowestObserved: number;
  highestObserved: number;
  fairnessScore: number;
  status: 'FAIR' | 'GOOD' | 'HIGH' | 'VERY_HIGH';
  statusLabel: string;
  priceDeltaPercent: number;
  distribution: { price: number; label: string; count: number }[];
  sourcesAnalyzedCount: number;
  lastUpdatedText: string;
  confidenceScore: number;
  kumbhContext?: PriceContextKumbh;
}

export interface WebReviewSnippet {
  id: string;
  author: string;
  rating: number;
  date: string;
  source: string;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  verified: boolean;
}

export interface ReviewSentiment {
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  overallRating: number;
  totalReviewsCount: number;
  reviewConfidenceScore: number;
  pros: string[];
  cons: string[];
  aspects: {
    name: string;
    score: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }[];
  webReviews: WebReviewSnippet[];
}

export interface ValueAnalysis {
  qualityScore: number;
  featuresScore: number;
  reviewsScore: number;
  priceScore: number;
  overallValueScore: number;
  valueStatement: string;
}

export type BuyingRecommendationStatus = 'BUY' | 'CONSIDER' | 'AVOID' | 'INSUFFICIENT_DATA';

export interface BuyingDecisionResult {
  recommendation: BuyingRecommendationStatus;
  overallScore: number;
  reason: string;
  decisionConfidence: number;
  componentScores: {
    price: number;
    quality: number;
    reviews: number;
    value: number;
    availability: number;
  };
  confidenceBreakdown: ConfidenceBreakdown;
  whyThisPrice: {
    marketMedian: number;
    observedRange: string;
    reviewScore: number;
    quality: string;
    location: string;
    warranty: string;
    marketConfidence: number;
    simpleExplanation: string;
  };
}

export interface AlternativeProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  rating: number;
  valueScore: number;
  keyFeature: string;
  badge?: string;
  specComparison: {
    name: string;
    targetValue: string;
    altValue: string;
  }[];
  imageUrl?: string;
}

export interface ProductAnalysisFull {
  id: string;
  product: IdentifiedProduct;
  quotedPrice: number;
  location: LocationInfo;
  priceIntelligence: PriceFairnessResult;
  priceObservations: PriceObservation[];
  whereToBuy: RetailerStoreOption[];
  reviews: ReviewSentiment;
  valueAnalysis: ValueAnalysis;
  buyingDecision: BuyingDecisionResult;
  alternatives: AlternativeProduct[];
  timestamp: string;
}

export interface UserRequirementRequest {
  query: string;
  quotedPrice?: number;
  location?: string;
}

// Transport Fare Intelligence Types
export interface RickshawFareAnalysis {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  distanceKm: number;
  isNightTariff: boolean;
  city: string;
  baseFare: number;
  ratePerKm: number;
  officialMeterFare: number;
  driverQuotedFare: number;
  fairFareRangeMin: number;
  fairFareRangeMax: number;
  fairnessScore: number;
  status: 'FAIR_METER' | 'SLIGHT_EXTRA' | 'OVERCHARGING' | 'EXTORTIONATE';
  statusLabel: string;
  fareDeltaPercent: number;
  recommendation: 'ACCEPT_FARE' | 'LOOK_FOR_OTHER_RIDE' | 'TAKE_SHARED_OR_APP';
  localTips: string[];
}

// ----------------------------------------------------
// NASHIK SIMHASTHA 2027 & PREDICTIVE INTELLIGENCE TYPES
// ----------------------------------------------------
export interface ShahiSnanDate {
  date: string;
  title: string;
  ghat: string;
  expectedCrowd: 'VERY_HIGH' | 'HIGH' | 'MODERATE';
  notes: string;
  verified: boolean;
}

export interface KumbhEventConfig {
  id: string;
  eventName: string;
  locationCity: string;
  startDate: string;
  endDate: string;
  isOfficialVerified: boolean;
  shahiSnanDates: ShahiSnanDate[];
  importantGhats: string[];
  highFootfallZones: string[];
  restrictedZones: string[];
  transportHubs: string[];
  serviceZones: string[];
}

export type PricePressureDirection = 'LOWER' | 'STABLE' | 'HIGHER' | 'UNCERTAIN';

export interface PredictionInput {
  selectedDate: string;
  selectedTime: string;
  originLocation?: string;
  destinationId: string;
  category?: string;
  baselinePrice?: number;
}

export interface PredictionResult {
  predictionId: string;
  selectedDate: string;
  selectedTime: string;
  isShahiSnan: boolean;
  shahiSnanTitle?: string;
  expectedCrowdLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  expectedDemandLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SURGE';
  transportAvailability: 'HIGH' | 'MODERATE' | 'LOW';
  pricePressureDirection: PricePressureDirection;
  predictionConfidence: number;
  confidenceLevel: 'HIGH' | 'GOOD' | 'MODERATE' | 'LOW / UNCERTAIN';
  predictedPriceMin: number;
  predictedPriceMax: number;
  baselinePrice: number;
  priceDeltaPercent: number;
  reasoning: string;
  factors: { name: string; impact: string; weight: number }[];
  modelVersion: string;
  timestamp: string;
}

export interface ModelMetrics {
  modelVersion: string;
  lastCalibratedDate: string;
  totalEvaluations: number;
  mae: number;
  rmse: number;
  mape: number;
  status: 'CALIBRATED' | 'TRAINING' | 'EARLY_STAGE';
}

export interface OverchargingReport {
  reportId: string;
  itemOrTripName: string;
  reportType: 'product_overcharging' | 'rickshaw_meter_refusal' | 'mrp_violation' | 'false_warranty';
  quotedPrice: number;
  fairPriceMax: number;
  priceDeltaPercent: number;
  sellerOrDriverName: string;
  shopAddressOrVehicleNo: string;
  city: string;
  evidenceNotes: string;
  authorityTarget: string;
  status: 'FILED' | 'UNDER_INVESTIGATION' | 'NOTICE_ISSUED' | 'RESOLVED';
  timestamp: string;
}

// ----------------------------------------------------
// NEW KUMBH VISITOR COMPANION TYPES
// ----------------------------------------------------
export type VerificationBadge = 'Verified' | 'Community Rated' | 'Official Source' | 'AI Estimated' | 'Demo Data';

export interface Pujari {
  id: string;
  name: string;
  specialization: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  verificationBadge: VerificationBadge;
  languages: string[];
  location: string;
  ghat: string;
  priceRange: string;
  phone: string;
  photoUrl?: string;
  overallScore: number;
  rank: number;
  whyRecommended: string[];
}

export interface Driver {
  id: string;
  driverName: string;
  photoUrl?: string;
  rating: number;
  reviewCount: number;
  vehicle: string;
  vehicleNo: string;
  location: string;
  phone: string;
  verificationBadge: VerificationBadge;
  drivingScore: number;
  languages: string[];
  estimatedPrice: string;
  rank: number;
  whyRecommended: string[];
}

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  distanceToGhatKm: number;
  amenities: string[];
  familyFriendly: boolean;
  childrenFriendly: boolean;
  parking: boolean;
  foodAvailable: boolean;
  location: string;
  phone: string;
  photoUrl?: string;
  verificationBadge: VerificationBadge;
  rank: number;
  whyRecommended: string[];
}

export interface KumbhLocation {
  id: string;
  name: string;
  type: 'ghat' | 'temple' | 'food' | 'shopping' | 'emergency' | 'ritual';
  description: string;
  location: string;
  timing: string;
  bestTimeToVisit: string;
  photoUrl?: string;
}

export interface DayActivity {
  time: string;
  location: string;
  activity: string;
  estimatedTravelTime: string;
  transportMode: string;
  transportCost: number;
  entryBookingCost: number;
  foodEstimate: number;
  costTotal: number;
}

export interface DayItinerary {
  dayNumber: number;
  dateLabel: string;
  title: string;
  activities: DayActivity[];
  dailyTotalCost: number;
}

export interface BudgetBreakdown {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  puja: number;
  shopping: number;
  emergencyBuffer: number;
  totalCalculated: number;
}

export interface TripPlan {
  id: string;
  groupSize: { adults: number; children: number };
  durationDays: number;
  totalBudget: number;
  travelStyle: 'Budget' | 'Balanced' | 'Comfort' | 'Premium';
  interests: string[];
  dailyItinerary: DayItinerary[];
  costBreakdown: BudgetBreakdown;
  effectiveTransportCost: number;
  remainingBudget: number;
  optimized: boolean;
  optimizationNotes?: string[];
}

export interface KitItem {
  id: string;
  name: string;
  category: 'Spiritual Essentials' | 'Clothing & Protection' | 'Hygiene & Health' | 'Travel Gear' | 'Document & Cash';
  recommendedQuantity: string;
  fairPriceRange: string;
  estimatedCost: number;
  essentialLevel: 'must_have' | 'recommended' | 'optional';
  notes: string;
  checked?: boolean;
}

export interface AskFairBuyMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  contextProduct?: string;
  transportCostNote?: string;
}

export interface AppSettings {
  demoMode: boolean;
  currency: string;
  defaultCity: string;
  defaultState: string;
  cacheFreshnessMinutes: number;
  fairPriceThresholdPercent: number;
  geminiApiKeyConfigured: boolean;
}
