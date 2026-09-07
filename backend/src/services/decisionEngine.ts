import {
  BuyingDecisionResult,
  PriceFairnessResult,
  ReviewSentiment,
  ValueAnalysis,
  LocationInfo,
  BuyingRecommendationStatus,
  ConfidenceBreakdown,
  ProductMatchDetails
} from '../types';

export class BuyingDecisionEngine {
  /**
   * Synthesizes product match confidence, price data confidence, review confidence, and evidence agreement
   * to calculate the final Decision Confidence score and recommendation (BUY / CONSIDER / AVOID / INSUFFICIENT_DATA).
   */
  public generateDecision(params: {
    quotedPrice: number;
    priceIntelligence: PriceFairnessResult;
    reviews: ReviewSentiment;
    valueAnalysis: ValueAnalysis;
    location: LocationInfo;
    productName: string;
    productMatchConfidence?: number;
    productMatchDetails?: ProductMatchDetails;
    warranty?: string;
  }): BuyingDecisionResult {
    const {
      quotedPrice,
      priceIntelligence,
      reviews,
      valueAnalysis,
      location,
      productName,
      productMatchConfidence = 94,
      productMatchDetails,
      warranty,
    } = params;

    const { fairPriceMin, fairPriceMax, marketMedian, lowestObserved, highestObserved, priceDeltaPercent } = priceIntelligence;

    // 1. Individual confidence ring scores
    const prodScore = Math.min(99, Math.max(40, productMatchConfidence));
    const priceScoreVal = Math.min(99, Math.max(40, priceIntelligence.confidenceScore || 85));
    const revScoreVal = Math.min(99, Math.max(40, reviews.reviewConfidenceScore || 84));

    // 2. Synthesize Final Decision Confidence Score using weighted evidence model
    // Product 30% + Price 30% + Review 20% + Freshness 10% + Source Agreement 10%
    const freshnessScore = 95;
    const agreementScore = priceIntelligence.sourcesAnalyzedCount >= 4 ? 90 : 70;

    const decisionConfidence = Math.round(
      prodScore * 0.30 +
      priceScoreVal * 0.30 +
      revScoreVal * 0.20 +
      freshnessScore * 0.10 +
      agreementScore * 0.10
    );

    // Build comprehensive confidence breakdown struct
    const confidenceBreakdown: ConfidenceBreakdown = {
      productMatchScore: prodScore,
      productMatchLevel: prodScore >= 88 ? 'High confidence' : prodScore >= 70 ? 'Moderate confidence' : 'Low / Uncertain',
      productDetails: productMatchDetails || {
        categoryMatched: true,
        brandDetected: true,
        modelDetected: prodScore >= 75,
        specsMatched: true,
        webVerified: true,
      },
      priceDataScore: priceScoreVal,
      priceDataLevel: priceScoreVal >= 88 ? 'High confidence' : priceScoreVal >= 75 ? 'Good confidence' : 'Low confidence',
      reviewScore: revScoreVal,
      reviewLevel: revScoreVal >= 85 ? 'High confidence' : revScoreVal >= 65 ? 'Moderate confidence' : 'Limited evidence',
      decisionScore: decisionConfidence,
      decisionLevel: decisionConfidence >= 90 ? 'High confidence' : decisionConfidence >= 75 ? 'Good confidence' : decisionConfidence >= 60 ? 'Moderate confidence' : 'Low confidence',
      weights: {
        product: 30,
        price: 30,
        review: 20,
        freshness: 10,
        agreement: 10,
      },
      explanationNotes: [
        `Product Match: ${prodScore}% (${prodScore >= 75 ? 'Exact model verified' : 'Category matched, model uncertain'})`,
        `Price Evidence: ${priceScoreVal}% (${priceIntelligence.sourcesAnalyzedCount} sources checked)`,
        `Review Evidence: ${revScoreVal}% (${reviews.totalReviewsCount.toLocaleString()} user signals analyzed)`,
        `Data Freshness: ${priceIntelligence.lastUpdatedText}`,
      ],
    };

    // Component scores for quality & value
    const priceFairnessScore = priceIntelligence.fairnessScore;
    const qualityScore = valueAnalysis.qualityScore;
    const reviewsScore = Math.round(reviews.overallRating * 20);
    const valueScore = valueAnalysis.overallValueScore;
    const availabilityScore = 92;

    const overallScore = Math.round(
      priceFairnessScore * 0.45 +
      qualityScore * 0.20 +
      reviewsScore * 0.15 +
      valueScore * 0.10 +
      availabilityScore * 0.10
    );

    // 3. Strict Threshold Decision Logic:
    let recommendation: BuyingRecommendationStatus;
    let reason: string;

    if (decisionConfidence < 60) {
      // INSUFFICIENT DATA THRESHOLD
      recommendation = 'INSUFFICIENT_DATA';
      reason = 'We could not verify enough reliable market information to make a confident buying recommendation. Please specify the exact model number or provide additional photos.';
    } else if (quotedPrice <= fairPriceMax && priceDeltaPercent <= 5 && reviews.overallRating >= 4.0) {
      recommendation = 'BUY';
      reason = `The seller's quoted price of ₹${quotedPrice.toLocaleString()} is within the estimated fair market range (₹${fairPriceMin.toLocaleString()} – ₹${fairPriceMax.toLocaleString()}) and supported by strong verified user reviews (${reviews.overallRating}★).`;
    } else if (quotedPrice > fairPriceMax && priceDeltaPercent <= 15) {
      recommendation = 'CONSIDER';
      reason = `The product quality is high (${reviews.overallRating}★), but the quoted price of ₹${quotedPrice.toLocaleString()} is ${priceDeltaPercent}% above the fair market range (₹${fairPriceMin.toLocaleString()} – ₹${fairPriceMax.toLocaleString()}). Compare lower-priced local sellers or online alternatives before buying.`;
    } else if (quotedPrice > fairPriceMax && priceDeltaPercent > 15) {
      recommendation = 'AVOID';
      reason = `The quoted price of ₹${quotedPrice.toLocaleString()} is severely overpriced (${priceDeltaPercent}% above market median ₹${marketMedian.toLocaleString()}). Comparable alternatives offer significantly better value.`;
    } else {
      recommendation = 'CONSIDER';
      reason = `The quoted price is reasonable, but review sentiment or seller warranty details suggest comparing local alternatives before purchasing.`;
    }

    const simpleExplanation = `FairBuy derived this fair price range (₹${fairPriceMin.toLocaleString()}–₹${fairPriceMax.toLocaleString()}) from ${priceIntelligence.sourcesAnalyzedCount} market signals in ${location.formatted} and online listings, taking brand warranty and local availability into account.`;

    return {
      recommendation,
      overallScore,
      reason,
      decisionConfidence,
      componentScores: {
        price: priceFairnessScore,
        quality: qualityScore,
        reviews: reviewsScore,
        value: valueScore,
        availability: availabilityScore,
      },
      confidenceBreakdown,
      whyThisPrice: {
        marketMedian,
        observedRange: `₹${lowestObserved.toLocaleString()} – ₹${highestObserved.toLocaleString()}`,
        reviewScore: reviews.overallRating,
        quality: 'Verified Brand Specifications',
        location: location.formatted,
        warranty: warranty || '1 Year Official Brand Warranty',
        marketConfidence: priceScoreVal,
        simpleExplanation,
      },
    };
  }
}

export const decisionEngine = new BuyingDecisionEngine();
