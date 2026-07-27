export interface OfferQualityScore {
  priceRating: number;       // 1 to 5 stars
  shippingRating: number;    // 1 to 5 stars
  discountRating: number;    // 1 to 5 stars
  conversionPotential: number; // 0 to 100%
  overallScore: number;      // 0 to 100%
  justification: string;
}
