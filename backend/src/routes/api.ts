import { Router, Request, Response } from 'express';
import { productService } from '../services/productService';
import { priceEngine } from '../services/priceEngine';
import { reviewEngine } from '../services/reviewEngine';
import { decisionEngine } from '../services/decisionEngine';
import { recommendationEngine } from '../services/recommendationEngine';
import { locationService } from '../services/locationService';
import { chatService } from '../services/chatService';
import { rickshawService } from '../services/rickshawService';
import { reportService } from '../services/reportService';
import { kumbhService } from '../services/kumbhService';
import { plannerService } from '../services/plannerService';
import { adminService } from '../services/adminService';
import { predictivePricingService } from '../services/predictivePricingService';
import { sampleProductsDatabase, initialSettings } from '../db/sampleData';
import { ProductAnalysisFull, AppSettings, ProductSpecification, RetailerStoreOption } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory store for active session analyses and settings
let analysisHistory: ProductAnalysisFull[] = [...sampleProductsDatabase];
let currentSettings: AppSettings = { ...initialSettings };

/**
 * POST /api/products/identify
 */
router.post('/products/identify', async (req: Request, res: Response) => {
  try {
    const { query, barcode, imageBuffer, category } = req.body;
    const result = await productService.identifyProductDetailed({ query, barcode, imageBuffer, category });
    res.json({ success: true, product: result.product, matchDetails: result.matchDetails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/products/analyze
 */
router.post('/products/analyze', async (req: Request, res: Response) => {
  try {
    const { productName, brand, model, category, quotedPrice, location, barcode, specifications, imageBuffer } = req.body;
    const numericQuoted = Number(quotedPrice) || 1200;

    const resolvedLoc = location?.latitude && location?.longitude
      ? locationService.reverseGeocode(location.latitude, location.longitude)
      : locationService.setManualLocation(location?.city || 'Nashik', location?.state || 'Maharashtra', location?.locality || 'College Road');

    const identificationResult = await productService.identifyProductDetailed({ query: productName || `${brand || ''} ${model || ''}`, barcode, category, imageBuffer });
    const product = identificationResult.product;

    if (specifications && Array.isArray(specifications) && specifications.length > 0) {
      product.specifications = specifications;
    }

    let observations = priceEngine.generateObservationsForProduct(product.id, product.name, numericQuoted, resolvedLoc);
    const priceIntelligence = priceEngine.calculatePriceFairness(numericQuoted, observations, resolvedLoc);
    const { reviews, valueAnalysis } = reviewEngine.analyzePublicReviews(product.name, product.brand, numericQuoted, priceIntelligence.fairPriceMax);

    const buyingDecision = decisionEngine.generateDecision({
      quotedPrice: numericQuoted,
      priceIntelligence,
      reviews,
      valueAnalysis,
      location: resolvedLoc,
      productName: product.name,
      productMatchConfidence: product.confidence,
      productMatchDetails: identificationResult.matchDetails,
      warranty: product.specifications.find((s: ProductSpecification) => s.name.toLowerCase().includes('warranty'))?.value,
    });

    const alternatives = recommendationEngine.getAlternativesForProduct(product.name, product.category, numericQuoted);

    const whereToBuy: RetailerStoreOption[] = [
      {
        id: `store-${uuidv4().substring(0, 8)}`,
        storeName: 'Amazon India Direct',
        storeLogoUrl: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=100&auto=format&fit=crop&q=80',
        channelType: 'online',
        price: priceIntelligence.marketMedian,
        currency: '₹',
        availability: 'In Stock',
        location: 'Pan-India (Fast Delivery)',
        warranty: '1 Year Brand Warranty',
        storeUrl: 'https://amazon.in',
      },
      {
        id: `store-${uuidv4().substring(0, 8)}`,
        storeName: 'Flipkart Electronics',
        storeLogoUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&auto=format&fit=crop&q=80',
        channelType: 'online',
        price: priceIntelligence.lowestObserved,
        currency: '₹',
        availability: 'Fast Delivery',
        location: 'Pan-India',
        warranty: '1 Year Brand Warranty',
        storeUrl: 'https://flipkart.com',
      },
      {
        id: `store-${uuidv4().substring(0, 8)}`,
        storeName: `Croma Retail ${resolvedLoc.city}`,
        storeLogoUrl: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=100&auto=format&fit=crop&q=80',
        channelType: 'authorized_dealer',
        price: priceIntelligence.fairPriceMax,
        currency: '₹',
        availability: 'In Stock',
        location: `${resolvedLoc.city} Main Outlet`,
        warranty: '1 Year Brand Warranty',
        storeUrl: 'https://croma.com',
      },
    ];

    const fullAnalysis: ProductAnalysisFull = {
      id: `analysis-${uuidv4().substring(0, 8)}`,
      product,
      quotedPrice: numericQuoted,
      location: resolvedLoc,
      priceIntelligence,
      priceObservations: observations,
      whereToBuy,
      reviews,
      valueAnalysis,
      buyingDecision,
      alternatives,
      timestamp: new Date().toISOString(),
    };

    analysisHistory.unshift(fullAnalysis);
    res.json({ success: true, data: fullAnalysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/kumbh/pujaris
 */
router.get('/kumbh/pujaris', (req: Request, res: Response) => {
  const ghat = req.query.ghat as string;
  const pujaris = kumbhService.getTopPujaris(ghat);
  res.json({ success: true, data: pujaris });
});

/**
 * GET /api/kumbh/transport
 */
router.get('/kumbh/transport', (req: Request, res: Response) => {
  const drivers = kumbhService.getTopDrivers();
  res.json({ success: true, data: drivers });
});

/**
 * GET /api/kumbh/hotels
 */
router.get('/kumbh/hotels', (req: Request, res: Response) => {
  const budget = req.query.budget as string;
  const familyOnly = req.query.familyOnly === 'true';
  const hotels = kumbhService.getTopHotels({ budget, familyOnly });
  res.json({ success: true, data: hotels });
});

/**
 * GET /api/kumbh/explore
 */
router.get('/kumbh/explore', (req: Request, res: Response) => {
  const type = req.query.type as string;
  const locations = kumbhService.getLocations(type);
  res.json({ success: true, data: locations });
});

/**
 * POST /api/kumbh/plan-trip
 */
router.post('/kumbh/plan-trip', (req: Request, res: Response) => {
  try {
    const { adults, children, days, budget, travelStyle, interests, hasElderly } = req.body;
    const plan = plannerService.generateTripPlan({
      adults: Number(adults) || 2,
      children: Number(children) || 0,
      days: Number(days) || 3,
      budget: Number(budget) || 10000,
      travelStyle,
      interests,
      hasElderly: Boolean(hasElderly),
    });
    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/kumbh/plan-kit
 */
router.post('/kumbh/plan-kit', (req: Request, res: Response) => {
  const { days, groupSize } = req.body;
  const kit = plannerService.generateKumbhKit(Number(days) || 3, Number(groupSize) || 2);
  res.json({ success: true, data: kit });
});

/**
 * POST /api/travel/calculate-route
 */
router.post('/travel/calculate-route', (req: Request, res: Response) => {
  try {
    const { originLat, originLon, destinationId, customDestinationName } = req.body;
    const route = locationService.calculateRouteToLandmark(
      originLat ? Number(originLat) : undefined,
      originLon ? Number(originLon) : undefined,
      destinationId,
      customDestinationName
    );

    const distanceKm = route.distanceKm;
    const modes = [
      { mode: 'Walking', timeMinutes: Math.round(distanceKm * 13), costRange: 'Free (₹0)', badge: 'Eco / Fit' },
      { mode: 'City Bus', timeMinutes: Math.round(distanceKm * 5 + 10), costRange: '₹15 – ₹30', badge: 'Cheapest' },
      { mode: 'Auto Rickshaw', timeMinutes: Math.round(distanceKm * 4 + 4), costRange: `₹${Math.round(25 + distanceKm * 15)} – ₹${Math.round(35 + distanceKm * 18)}`, badge: 'Popular' },
      { mode: 'App Taxi / Cab', timeMinutes: Math.round(distanceKm * 3.5 + 5), costRange: `₹${Math.round(50 + distanceKm * 22)} – ₹${Math.round(70 + distanceKm * 25)}`, badge: 'Comfort' },
    ];

    res.json({
      success: true,
      route: {
        destination: route.destination,
        distanceKm,
        estimatedTimeMinutes: Math.round(distanceKm * 4 + 5),
        modes,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/kumbh/effective-cost
 */
router.post('/kumbh/effective-cost', (req: Request, res: Response) => {
  const { productPrice, sellerDistanceKm, transportMode, alternativePrice, alternativeDistanceKm } = req.body;
  const result = plannerService.calculateEffectiveBuyingCost({
    productPrice: Number(productPrice) || 250,
    sellerDistanceKm: Number(sellerDistanceKm) || 2.0,
    transportMode,
    alternativePrice: alternativePrice ? Number(alternativePrice) : undefined,
    alternativeDistanceKm: alternativeDistanceKm ? Number(alternativeDistanceKm) : undefined,
  });
  res.json({ success: true, data: result });
});

/**
 * POST /api/rickshaw/fare
 */
router.post('/rickshaw/fare', (req: Request, res: Response) => {
  try {
    const { pickup, dropoff, distanceKm, driverQuotedFare, isNightTariff, location } = req.body;
    const resolvedLoc = location || locationService.reverseGeocode();

    const analysis = rickshawService.calculateRickshawFare({
      pickup: pickup || 'Nashik Railway Station',
      dropoff: dropoff || 'College Road',
      distanceKm: Number(distanceKm) || 4.5,
      driverQuotedFare: Number(driverQuotedFare) || 120,
      isNightTariff: Boolean(isNightTariff),
      location: resolvedLoc,
    });

    res.json({ success: true, data: analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/reports/submit
 */
router.post('/reports/submit', (req: Request, res: Response) => {
  try {
    const { itemOrTripName, reportType, quotedPrice, fairPriceMax, sellerOrDriverName, shopAddressOrVehicleNo, city, evidenceNotes } = req.body;

    const newReport = reportService.submitReport({
      itemOrTripName: itemOrTripName || 'Consumer Item / Rickshaw Trip',
      reportType: reportType || 'product_overcharging',
      quotedPrice: Number(quotedPrice) || 1200,
      fairPriceMax: Number(fairPriceMax) || 1000,
      sellerOrDriverName: sellerOrDriverName || 'Local Seller',
      shopAddressOrVehicleNo: shopAddressOrVehicleNo || 'Local Outlet',
      city: city || 'Nashik',
      evidenceNotes,
    });

    res.json({ success: true, report: newReport });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/reports
 */
router.get('/reports', (req: Request, res: Response) => {
  res.json({ success: true, reports: reportService.getAllReports() });
});

/**
 * GET /api/history
 */
router.get('/history', (req: Request, res: Response) => {
  res.json({ success: true, data: analysisHistory });
});

/**
 * POST /api/chat
 */
router.post('/chat', (req: Request, res: Response) => {
  const { question, activeAnalysisId } = req.body;
  const activeContext = analysisHistory.find((a) => a.id === activeAnalysisId) || analysisHistory[0];
  const answer = chatService.answerProductQuestion(question, activeContext);
  res.json({ success: true, answer });
});

/**
 * POST /api/predictive/price-pressure
 */
router.post('/predictive/price-pressure', (req: Request, res: Response) => {
  try {
    const { selectedDate, selectedTime, originLocation, destinationId, category, baselinePrice } = req.body;
    const prediction = predictivePricingService.predictPricePressure({
      selectedDate: selectedDate || '2027-08-14',
      selectedTime: selectedTime || '18:30',
      originLocation,
      destinationId: destinationId || 'ram-kund',
      category,
      baselinePrice: Number(baselinePrice) || 500,
    });
    res.json({ success: true, prediction });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/kumbh/event-config
 */
router.get('/kumbh/event-config', (req: Request, res: Response) => {
  res.json({ success: true, eventConfig: predictivePricingService.getEventConfig() });
});

/**
 * PUT /api/admin/event-config
 */
router.put('/admin/event-config', (req: Request, res: Response) => {
  const updated = predictivePricingService.updateEventConfig(req.body);
  res.json({ success: true, eventConfig: updated });
});

/**
 * GET /api/admin/stats
 */
router.get('/admin/stats', (req: Request, res: Response) => {
  res.json({ success: true, stats: adminService.getStats() });
});

/**
 * GET /api/admin/entries
 */
router.get('/admin/entries', (req: Request, res: Response) => {
  res.json({ success: true, entries: adminService.getAddedEntries() });
});

/**
 * POST /api/admin/import
 */
router.post('/admin/import', (req: Request, res: Response) => {
  const { records } = req.body;
  const result = adminService.importBulkData(Array.isArray(records) ? records : []);
  res.json({ success: true, data: result });
});

/**
 * POST /api/location/reverse-geocode
 */
router.post('/location/reverse-geocode', (req: Request, res: Response) => {
  const { latitude, longitude, city, state } = req.body;
  const loc = city && state ? locationService.setManualLocation(city, state) : locationService.reverseGeocode(latitude, longitude);
  res.json({ success: true, location: loc });
});

/**
 * GET /api/settings
 */
router.get('/settings', (req: Request, res: Response) => {
  res.json({ success: true, settings: currentSettings });
});

/**
 * PUT /api/settings
 */
router.put('/settings', (req: Request, res: Response) => {
  currentSettings = { ...currentSettings, ...req.body };
  res.json({ success: true, settings: currentSettings });
});

export default router;
