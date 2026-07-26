'use client';

import { useQuery } from '@tanstack/react-query';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';

export function useProducts(userId: string = 'default_admin_user') {
  return useQuery({
    queryKey: ['products', userId],
    queryFn: async () => {
      const repo = new FirestoreProductRepository();
      const products = await repo.findAll(userId);
      return products.map((p) => ({
        id: p.id,
        title: p.title,
        brand: p.brand,
        marketplaceSlug: p.marketplaceSlug,
        currentPrice: p.currentPrice.formatBRL(),
        previousPrice: p.previousPrice ? p.previousPrice.formatBRL() : null,
        discountPercentage: p.discountPercentage.formatString(),
        mainImage: p.images[0] || '',
        affiliateUrl: p.affiliateUrl.url,
        status: p.status,
      }));
    },
  });
}
