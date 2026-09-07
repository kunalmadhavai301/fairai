import axios from 'axios';
import { ProductAnalysisFull } from '../types';

export class ChatService {
  /**
   * Answers product buying & price questions using real-time Gemini API with context.
   */
  public async answerProductQuestion(question: string, context?: ProductAnalysisFull): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    // Try calling Google Gemini API in real-time if key is present
    if (apiKey) {
      try {
        const systemPrompt = this.buildPromptContext(question, context);
        const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];

        for (const model of modelsToTry) {
          try {
            const response = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
              {
                contents: [
                  {
                    parts: [
                      {
                        text: systemPrompt,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 500,
                },
              },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
              }
            );

            const textOutput = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textOutput && textOutput.trim()) {
              return textOutput.trim();
            }
          } catch (modelErr: any) {
            // Try next model if 404 or model error
            continue;
          }
        }
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to local reasoning:', err?.message);
      }
    }

    // Fallback local rule-based response engine if API is unreachable or rate limited
    return this.fallbackLocalAnswer(question, context);
  }

  private buildPromptContext(question: string, context?: ProductAnalysisFull): string {
    let contextDetails = 'No specific product scanned yet.';
    if (context) {
      const { product, quotedPrice, priceIntelligence, reviews, buyingDecision, location, alternatives } = context;
      const { fairPriceMin, fairPriceMax, marketMedian, lowestObserved } = priceIntelligence;
      const altNames = alternatives ? alternatives.map(a => `${a.name} (₹${a.price})`).join(', ') : 'None';

      contextDetails = `
Product Name: ${product.name}
Brand: ${product.brand}
Category: ${product.category}
Quoted Price by Seller: ₹${quotedPrice}
Fair Price Range: ₹${fairPriceMin} - ₹${fairPriceMax}
Market Median Price: ₹${marketMedian}
Lowest Observed Price: ₹${lowestObserved}
Buyer Location: ${location?.formatted || 'Nashik, Maharashtra'}
User Review Rating: ${reviews?.overallRating || '4.5'}/5 (${reviews?.totalReviewsCount || 100} reviews)
Buying Recommendation: ${buyingDecision?.recommendation || 'CONSIDER'} (Score: ${buyingDecision?.overallScore || 75}/100)
Key Specs: ${product.specifications?.map(s => `${s.name}: ${s.value}`).join('; ') || 'Standard specs'}
Recommended Alternatives: ${altNames}
`;
    }

    return `You are Ask FairBuy AI, an expert, concise, and trustworthy price-intelligence and shopping decision assistant for Indian consumers.
Answer the user's question clearly in 2-4 sentences using the product and market evidence provided below. Provide practical advice regarding fair pricing, legitimate price variances, or transport/buying trade-offs.

[Product & Market Data Context]
${contextDetails}

[User Question]
${question}

Your Answer:`;
  }

  private fallbackLocalAnswer(question: string, context?: ProductAnalysisFull): string {
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
      if (context.alternatives && context.alternatives.length > 0) {
        const topAlt = context.alternatives[0];
        return `A great alternative is ${topAlt.name} (${topAlt.brand}) available at ₹${topAlt.price.toLocaleString()} with a ${topAlt.rating}★ rating (${topAlt.badge}).`;
      }
      return `Look for online listings on Amazon or Flipkart where observed prices for this model drop down to ₹${lowestObserved.toLocaleString()}.`;
    }

    if (q.includes('outdoor') || q.includes('travel') || q.includes('daily')) {
      return `${product.name} features ${product.specifications?.map(s => `${s.name}: ${s.value}`).slice(0, 3).join(', ') || 'durable construction'}. Reviewers highlight high durability (${reviews.aspects?.find(a => a.name.includes('Durability'))?.score || 85}% positive), making it suitable for regular daily use.`;
    }

    if (q.includes('look for') || q.includes('check before buying')) {
      return `Before purchasing: 1. Confirm official brand warranty (${context.priceObservations?.[0]?.warranty || '1 Year'}). 2. Inspect physical seal & serial number. 3. Check if seller includes localized GST tax invoice. 4. Verify fair price range is ₹${fairPriceMin.toLocaleString()}–₹${fairPriceMax.toLocaleString()}.`;
    }

    return `Based on FairBuy's analysis of ${priceIntelligence.sourcesAnalyzedCount} market signals in ${location.formatted}: ${product.name} is quoted at ₹${quotedPrice.toLocaleString()}. The fair market range is ₹${fairPriceMin.toLocaleString()}–₹${fairPriceMax.toLocaleString()} (Median ₹${marketMedian.toLocaleString()}). Overall buying decision: ${buyingDecision.recommendation} (${buyingDecision.overallScore}/100 score).`;
  }
}

export const chatService = new ChatService();
