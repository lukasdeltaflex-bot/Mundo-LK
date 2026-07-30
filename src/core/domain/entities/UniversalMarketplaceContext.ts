export type MarketplaceMentionMode = 'AUTO' | 'ALWAYS' | 'NEVER';

export interface UniversalMarketplaceBranding {
  nome: string;
  cor: string;
  logo: string;
  icone: string;
}

export type TrustLevel = 'popular' | 'intermediario' | 'premium' | 'internacional';
export type AudienceProfile = 'preco_competitivo' | 'conveniencia' | 'qualidade_premium' | 'achados';
export type BuyingBehavior = 'impulso' | 'pesquisa' | 'fidelidade';

export interface MarketplaceCommercialStrategy {
  trustLevel: TrustLevel;
  audienceProfile: AudienceProfile;
  buyingBehavior: BuyingBehavior;
  conversionTriggers: string[];
  recommendedStyle: string;
}

export interface MarketplaceContext {
  id: string;
  nome: string;
  categoria: string;
  tipo: string;
  identidadeVisual: UniversalMarketplaceBranding;
  strategy: MarketplaceCommercialStrategy;
}

export interface VerifiedOfferCommercialData {
  freteGratis: boolean;
  tipoFrete?: string;
  parcelamentoDisponivel: boolean;
  parcelamentoMaximo?: string;
  vendedorOficial: boolean;
  nomeVendedor?: string;
  avaliacaoVendedor?: string;
  avaliacaoProduto?: string;
  descontoConfirmado?: string;
  estoqueConfirmado?: boolean;
}

export interface OfferContext {
  productId: string;
  title: string;
  currentPrice: string;
  currentPriceAmount: number;
  previousPrice?: string;
  previousPriceAmount?: number;
  discountPercentage: string;
  dadosComerciaisValidados: VerifiedOfferCommercialData;
}

export interface AIUniversalMarketplacePayload {
  marketplaceContext: MarketplaceContext;
  offerContext: OfferContext;
  mentionMode: MarketplaceMentionMode;
}
