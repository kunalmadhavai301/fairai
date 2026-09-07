import { ProductAnalysisFull } from '../types';

export class ChatService {
  /**
   * Answers product buying questions using analyzed product context.
   */
  public answerProductQuestion(question: string, context?: ProductAnalysisFull): string {
    const q = question.toLowerCase();

    if (!context) {
      return "I don't have enough reliable product context loaded right now. Please scan or select a product first.";
    }

    const { product, quotedPrice, priceIntelligence, reviews, buyingDecision, location } = context;
    const { fairPriceMin, fairPriceMax, marketMedian, lowestObserved } = priceIntelligence;

    if (q.includes('worth') || q.includes('should i buy') || q.includes('good deal')) {
      if (buyingDecision.recommendation === 'BUY') {
        return `Yes! At ₹${quotedPrice.toLocaleString()}, this price is within the estimated fair range (₹${fairPriceMin.toLocaleString()}–₹${fairPriceMax.toLocaleString()}) in ${location.formatted}. Based on ${reviews.overallRating}★ user reviews, it offers excellent value.`;
      } else if (buyingDecision.recommendation === 'CONSIDER') {
        return `At ₹${quotedPrice.toLocaleString()}, it's roughly ${priceIntelligence.priceDeltaPercent}% higher than the median market price (₹${marketMedian.toLocaleString()}). The product quality is strong (${reviews.overallRating}★), but you should check online platforms like Amazon/Flipkart or authorized local stores where prices start around ₹${lowestObserved.toLocaleString()}.`;
      } else {
        return `No, at ₹${quotedPrice.toLocaleString()}, it is overpriced by ${priceIntelligence.priceDeltaPercent}%. The fair market range in ${location.formatted} is ₹${fairPriceMin.toLocaleString()}–₹${fairPriceMax.toLocaleString()}. I recommend looking at recommended alternative options.`;
      }
    }

    if (q.includes('expensive') || q.includes('why high') || q.includes('cost')) {
      return `${product.name} carries a quoted seller price of ₹${quotedPrice.toLocaleString()}. Market signals show median pricing is ₹${marketMedian.toLocaleString()}. The price in local physical shops often includes store overheads or localized shipping, whereas online prices range from ₹${lowestObserved.toLocaleString()} to ₹${fairPriceMax.toLocaleString()}.`;
    }

    if (q.includes('cheaper') || q.includes('alternative') || q.includes('lower price')) {
      if (context.alternatives.length > 0) {
        const topAlt = context.alternatives[0];
        return `A great alternative is ${topAlt.name} (${topAlt.brand}) available at ₹${topAlt.price.toLocaleString()} with a ${topAlt.rating}★ rating (${topAlt.badge}).`;
      }
      return `Look for online listings on Amazon or Flipkart where observed prices for this model drop down to ₹${lowestObserved.toLocaleString()}.`;
    }

    if (q.includes('outdoor') || q.includes('travel') || q.includes('daily')) {
      return `${product.name} features ${product.specifications.map(s => `${s.name}: ${s.value}`).slice(0, 3).join(', ')}. Reviewers highlight high durability (${reviews.aspects.find(a => a.name.includes('Durability'))?.score || 85}% positive), making it suitable for regular daily use.`;
    }

    if (q.includes('look for') || q.includes('check before buying')) {
      return `Before purchasing: 1. Confirm official brand warranty (${context.priceObservations[0]?.warranty || '1 Year'}). 2. Inspect physical seal & serial number. 3. Check if seller includes localized GST tax invoice. 4. Verify fair price range is ₹${fairPriceMin.toLocaleString()}–₹${fairPriceMax.toLocaleString()}.`;
    }

    // Default intelligent response using context
    return `Based on FairBuy's analysis of ${priceIntelligence.sourcesAnalyzedCount} market signals in ${location.formatted}: ${product.name} is quoted at ₹${quotedPrice.toLocaleString()}. The fair market range is ₹${fairPriceMin.toLocaleString()}–₹${fairPriceMax.toLocaleString()} (Median ₹${marketMedian.toLocaleString()}). Overall buying decision: ${buyingDecision.recommendation} (${buyingDecision.overallScore}/100 score).`;
  }
}

export const chatService = new ChatService();
