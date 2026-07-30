export interface MarketplaceIntelligenceScoreProps {
  trustScore: number;                 // 0 a 100 (Autoridade e reputacao institucional)
  priceSensitivity: number;           // 0 a 100 (Sensibilidade a preco baixo vs status)
  urgencyScore: number;               // 0 a 100 (Receptividade a gatilhos de escassez)
  premiumScore: number;               // 0 a 100 (Percepcao de valor e desejo de marca)
  deliveryScore?: number;             // 0 a 100 (Velocidade e eficiencia logistica)
  socialProofScore?: number;          // 0 a 100 (Forca de avaliacoes e volume de vendas)
  affiliateConversionScore?: number; // 0 a 100 (Historico de conversao do canal)
}

export class MarketplaceIntelligenceScore {
  public readonly trustScore: number;
  public readonly priceSensitivity: number;
  public readonly urgencyScore: number;
  public readonly premiumScore: number;
  public readonly deliveryScore: number;
  public readonly socialProofScore: number;
  public readonly affiliateConversionScore: number;

  constructor(props: MarketplaceIntelligenceScoreProps) {
    this.trustScore = Math.min(100, Math.max(0, props.trustScore));
    this.priceSensitivity = Math.min(100, Math.max(0, props.priceSensitivity));
    this.urgencyScore = Math.min(100, Math.max(0, props.urgencyScore));
    this.premiumScore = Math.min(100, Math.max(0, props.premiumScore));
    this.deliveryScore = Math.min(100, Math.max(0, props.deliveryScore ?? 75));
    this.socialProofScore = Math.min(100, Math.max(0, props.socialProofScore ?? 80));
    this.affiliateConversionScore = Math.min(100, Math.max(0, props.affiliateConversionScore ?? 85));
  }

  public static create(props: MarketplaceIntelligenceScoreProps): MarketplaceIntelligenceScore {
    return new MarketplaceIntelligenceScore(props);
  }

  /**
   * Retorna os 7 scores padrao refinados por marketplace slug
   */
  public static getByMarketplace(slug: string): MarketplaceIntelligenceScore {
    const s = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    switch (s) {
      case 'shopee':
        return new MarketplaceIntelligenceScore({
          trustScore: 85,
          priceSensitivity: 95,
          urgencyScore: 90,
          premiumScore: 40,
          deliveryScore: 80,
          socialProofScore: 95,
          affiliateConversionScore: 94,
        });
      case 'mercadolivre':
        return new MarketplaceIntelligenceScore({
          trustScore: 92,
          priceSensitivity: 75,
          urgencyScore: 70,
          premiumScore: 70,
          deliveryScore: 98,
          socialProofScore: 92,
          affiliateConversionScore: 92,
        });
      case 'amazon':
        return new MarketplaceIntelligenceScore({
          trustScore: 98,
          priceSensitivity: 50,
          urgencyScore: 60,
          premiumScore: 95,
          deliveryScore: 99,
          socialProofScore: 90,
          affiliateConversionScore: 88,
        });
      case 'magalu':
        return new MarketplaceIntelligenceScore({
          trustScore: 90,
          priceSensitivity: 70,
          urgencyScore: 65,
          premiumScore: 65,
          deliveryScore: 88,
          socialProofScore: 85,
          affiliateConversionScore: 85,
        });
      case 'aliexpress':
        return new MarketplaceIntelligenceScore({
          trustScore: 80,
          priceSensitivity: 98,
          urgencyScore: 85,
          premiumScore: 35,
          deliveryScore: 65,
          socialProofScore: 88,
          affiliateConversionScore: 90,
        });
      case 'tiktokshop':
      case 'shein':
        return new MarketplaceIntelligenceScore({
          trustScore: 82,
          priceSensitivity: 92,
          urgencyScore: 95,
          premiumScore: 45,
          deliveryScore: 75,
          socialProofScore: 96,
          affiliateConversionScore: 96,
        });
      default:
        return new MarketplaceIntelligenceScore({
          trustScore: 85,
          priceSensitivity: 80,
          urgencyScore: 75,
          premiumScore: 60,
          deliveryScore: 80,
          socialProofScore: 80,
          affiliateConversionScore: 85,
        });
    }
  }
}
