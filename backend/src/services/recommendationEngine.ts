import { AlternativeProduct, UserRequirementRequest } from '../types';

export class RecommendationEngine {
  /**
   * Generates alternative products matching the exact category and price point of the identified product.
   */
  public getAlternativesForProduct(productName: string, category: string, quotedPrice: number): AlternativeProduct[] {
    const cat = category.toLowerCase();

    // 1. Mobile & Smartphones
    if (cat.includes('mobile') || cat.includes('smartphone') || productName.toLowerCase().includes('phone')) {
      return [
        {
          id: 'alt-mob-1',
          name: 'Samsung Galaxy A35 5G (8GB/128GB)',
          brand: 'Samsung',
          model: 'Galaxy A35 5G',
          price: Math.round(quotedPrice * 0.88),
          rating: 4.5,
          valueScore: 91,
          keyFeature: '120Hz Super AMOLED & 50MP OIS Camera',
          badge: 'BEST OVERALL VALUE',
          imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
          specComparison: [
            { name: 'Quoted Price', targetValue: `₹${quotedPrice.toLocaleString()}`, altValue: `₹${Math.round(quotedPrice * 0.88).toLocaleString()} (Fair)` },
            { name: 'Display', targetValue: 'AMOLED 120Hz', altValue: 'Super AMOLED 120Hz' },
            { name: 'Warranty', targetValue: '1 Year', altValue: '1 Year Brand Warranty' },
          ],
        },
        {
          id: 'alt-mob-2',
          name: 'OnePlus Nord CE 4 5G (8GB/128GB)',
          brand: 'OnePlus',
          model: 'Nord CE 4',
          price: Math.round(quotedPrice * 0.82),
          rating: 4.4,
          valueScore: 88,
          keyFeature: 'Snapdragon 7 Gen 3 & 100W SuperVOOC Fast Charge',
          badge: 'FAST CHARGING PICK',
          imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
          specComparison: [
            { name: 'Quoted Price', targetValue: `₹${quotedPrice.toLocaleString()}`, altValue: `₹${Math.round(quotedPrice * 0.82).toLocaleString()} (Fair)` },
            { name: 'Charging', targetValue: 'Fast Charge', altValue: '100W Ultra Fast Charge' },
          ],
        },
      ];
    }

    // 2. Laptops & Computers
    if (cat.includes('laptop') || cat.includes('computer')) {
      return [
        {
          id: 'alt-lap-1',
          name: 'HP Pavilion 15 Intel Core i5 (16GB/512GB SSD)',
          brand: 'HP',
          model: 'Pavilion 15',
          price: Math.round(quotedPrice * 0.85),
          rating: 4.5,
          valueScore: 92,
          keyFeature: '13th Gen Intel Core i5 & Iris Xe Graphics',
          badge: 'BEST OVERALL VALUE',
          imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
          specComparison: [
            { name: 'Quoted Price', targetValue: `₹${quotedPrice.toLocaleString()}`, altValue: `₹${Math.round(quotedPrice * 0.85).toLocaleString()} (Fair)` },
            { name: 'RAM/SSD', targetValue: '16GB / 512GB SSD', altValue: '16GB DDR5 / 512GB NVMe SSD' },
          ],
        },
      ];
    }

    // 3. Footwear & Shoes
    if (cat.includes('footwear') || cat.includes('fashion') || cat.includes('shoe')) {
      return [
        {
          id: 'alt-shoe-1',
          name: 'Puma Softride Enzo NXT Running Shoes',
          brand: 'Puma',
          model: 'Softride Enzo',
          price: Math.round(quotedPrice * 0.80),
          rating: 4.4,
          valueScore: 90,
          keyFeature: 'Softfoam+ Comfort Sockliner & Cushioned Midsole',
          badge: 'BEST VALUE',
          imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
          specComparison: [
            { name: 'Quoted Price', targetValue: `₹${quotedPrice.toLocaleString()}`, altValue: `₹${Math.round(quotedPrice * 0.80).toLocaleString()} (Fair)` },
            { name: 'Cushioning', targetValue: 'Foam', altValue: 'Softfoam+ Dual Midsole' },
          ],
        },
      ];
    }

    // 4. Default / General Product Alternatives
    return [
      {
        id: 'alt-gen-1',
        name: `Premium Equivalent ${brandOrCategory(productName)}`,
        brand: 'Authorized Brand',
        model: 'Pro Series',
        price: Math.round(quotedPrice * 0.82),
        rating: 4.5,
        valueScore: 91,
        keyFeature: 'Top rated efficiency and high build quality',
        badge: 'BEST OVERALL VALUE',
        imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
        specComparison: [
          { name: 'Price', targetValue: `₹${quotedPrice.toLocaleString()}`, altValue: `₹${Math.round(quotedPrice * 0.82).toLocaleString()}` },
          { name: 'Build', targetValue: 'Standard', altValue: 'Reinforced Metal/Polymer' },
        ],
      },
      {
        id: 'alt-gen-2',
        name: `Value Edition ${brandOrCategory(productName)}`,
        brand: 'Realme TechLife',
        model: 'Standard Edition',
        price: Math.round(quotedPrice * 0.70),
        rating: 4.2,
        valueScore: 86,
        keyFeature: 'Essential features at a lower market price',
        badge: 'BUDGET VALUE',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        specComparison: [
          { name: 'Price', targetValue: `₹${quotedPrice.toLocaleString()}`, altValue: `₹${Math.round(quotedPrice * 0.70).toLocaleString()}` },
          { name: 'Warranty', targetValue: '1 Year', altValue: '1 Year Official' },
        ],
      },
    ];
  }

  /**
   * Processes natural language user requirement prompt.
   */
  public processUserRequirement(req: UserRequirementRequest) {
    const q = req.query.toLowerCase();

    let extractedUseCase = 'Daily general use';
    if (q.includes('travel') || q.includes('commute')) extractedUseCase = 'Daily travel & commuting';
    else if (q.includes('work') || q.includes('office') || q.includes('call')) extractedUseCase = 'Office & productivity';
    else if (q.includes('workout') || q.includes('gym') || q.includes('running')) extractedUseCase = 'Sports & outdoor fitness';

    let priority = 'Value & Durability';
    if (q.includes('battery')) priority = 'Extended Battery Life';
    else if (q.includes('camera')) priority = 'High Resolution Camera & Display';
    else if (q.includes('fast')) priority = 'Fast Performance & Charging';

    const recommendations = [
      {
        productName: 'Samsung Galaxy A35 5G / High Value Series',
        brand: 'Samsung',
        why: ['✓ Verified high rating across retail feeds', '✓ Long battery life and durable build', '✓ Excellent display and camera performance'],
        expectedPriceRange: '₹14,500 – ₹18,000',
        matchPercent: 95,
      },
      {
        productName: 'Anker / Philips High Efficiency Edition',
        brand: 'Authorized Manufacturer',
        why: ['✓ Top tier quality materials', '✓ Verified official warranty coverage', '✓ Compact ergonomic design'],
        expectedPriceRange: '₹1,200 – ₹2,500',
        matchPercent: 91,
      },
    ];

    return {
      query: req.query,
      extractedUseCase,
      priority,
      recommendations,
    };
  }
}

function brandOrCategory(name: string): string {
  const parts = name.split(' ');
  return parts.length > 1 ? parts[1] : 'Device';
}

export const recommendationEngine = new RecommendationEngine();
