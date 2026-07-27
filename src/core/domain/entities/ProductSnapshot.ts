export interface ProductSnapshot {
  snapshotId: string;
  productId: string;
  price: number | null;
  oldPrice: number | null;
  discountPercentage: number;
  sellerName?: string;
  timestamp: string;
}

export interface PriceDeltaAnalysis {
  isPriceDrop: boolean;
  priceDiff: number;
  priceDropPercentage: number;
  isDiscountIncrease: boolean;
  message?: string;
}

export function analyzePriceDelta(previousSnapshot: ProductSnapshot | null, currentPrice: number | null, currentDiscount: number): PriceDeltaAnalysis {
  if (!previousSnapshot || !previousSnapshot.price || !currentPrice) {
    return {
      isPriceDrop: false,
      priceDiff: 0,
      priceDropPercentage: 0,
      isDiscountIncrease: false,
    };
  }

  const prevPrice = previousSnapshot.price;
  const diff = prevPrice - currentPrice;
  const isDrop = diff > 0.05; // At least 5 cents drop
  const dropPct = isDrop ? Math.round((diff / prevPrice) * 100) : 0;
  const isDiscInc = currentDiscount > previousSnapshot.discountPercentage;

  let message: string | undefined;
  if (isDrop) {
    message = `🔥 O PREÇO CAIU! De R$ ${prevPrice.toFixed(2).replace('.', ',')} por apenas R$ ${currentPrice.toFixed(2).replace('.', ',')} (${dropPct}% de queda)!`;
  }

  return {
    isPriceDrop: isDrop,
    priceDiff: Math.max(0, diff),
    priceDropPercentage: dropPct,
    isDiscountIncrease: isDiscInc,
    message,
  };
}
