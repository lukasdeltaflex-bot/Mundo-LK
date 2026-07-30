export interface MarketplaceIntelligenceScoreProps {
  trustScore: number;         // 0 a 100 (Autoridade e reputacao institucional)
  priceSensitivity: number;   // 0 a 100 (Sensibilidade a preco baixo vs status)
  urgencyScore: number;       // 0 a 100 (Receptividade a gatilhos de escassez)
  premiumScore: number;       // 0 a 100 (Percepcao de valor e desejo de marca)
}

export class MarketplaceIntelligenceScore {
  public readonly trustScore: number;
  public readonly priceSensitivity: number;
  public readonly urgencyScore: number;
  public readonly premiumScore: number;

  constructor(props: MarketplaceIntelligenceScoreProps) {
    this.trustScore = Math.min(100, Math.max(0, props.trustScore));
    this.priceSensitivity = Math.min(100, Math.max(0, props.priceSensitivity));
    this.urgencyScore = Math.min(100, Math.max(0, props.urgencyScore));
    this.premiumScore = Math.min(100, Math.max(0, props.premiumScore));
  }

  public static create(props: MarketplaceIntelligenceScoreProps): MarketplaceIntelligenceScore {
    return new MarketplaceIntelligenceScore(props);
  }

  /**
   * Retorna os scores padrao por marketplace slug
   */
  public static getByMarketplace(slug: string): MarketplaceIntelligenceScore {
    const s = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    switch (s) {
      case 'shopee':
        return new MarketplaceIntelligenceScore({ trustScore: 85, priceSensitivity: 95, urgencyScore: 90, premiumScore: 40 });
      case 'mercadolivre':
        return new MarketplaceIntelligenceScore({ trustScore: 92, priceSensitivity: 75, urgencyScore: 70, premiumScore: 70 });
      case 'amazon':
        return new MarketplaceIntelligenceScore({ trustScore: 98, priceSensitivity: 50, urgencyScore: 60, premiumScore: 95 });
      case 'magalu':
        return new MarketplaceIntelligenceScore({ trustScore: 90, priceSensitivity: 70, urgencyScore: 65, premiumScore: 65 });
      case 'aliexpress':
        return new MarketplaceIntelligenceScore({ trustScore: 80, priceSensitivity: 98, urgencyScore: 85, premiumScore: 35 });
      case 'tiktokshop':
      case 'shein':
        return new MarketplaceIntelligenceScore({ trustScore: 82, priceSensitivity: 92, urgencyScore: 95, premiumScore: 45 });
      default:
        return new MarketplaceIntelligenceScore({ trustScore: 85, priceSensitivity: 80, urgencyScore: 75, premiumScore: 60 });
    }
  }
}
