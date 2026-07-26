export type ChampionRankTier =
  | '🔥 Produto Campeão'
  | '⭐ Produto com potencial'
  | '📦 Produto comum'
  | '⚠ Produto pouco utilizado';

export interface RankedProduct {
  id: string;
  title: string;
  category: string;
  marketplace: string;
  publicationCount: number;
  score: number;
  lastPublishedAt: string;
  tier: ChampionRankTier;
}

export class ProductRankingService {
  public static rankProduct(
    publicationCount: number,
    aiScore: number
  ): { score: number; tier: ChampionRankTier } {
    const totalPotential = Math.round(aiScore * 0.6 + Math.min(publicationCount * 10, 40));

    let tier: ChampionRankTier = '📦 Produto comum';

    if (totalPotential >= 85) {
      tier = '🔥 Produto Campeão';
    } else if (totalPotential >= 70) {
      tier = '⭐ Produto com potencial';
    } else if (totalPotential < 50 && publicationCount === 0) {
      tier = '⚠ Produto pouco utilizado';
    }

    return { score: totalPotential, tier };
  }
}
