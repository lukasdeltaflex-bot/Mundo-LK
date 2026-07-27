import { ProductExtractionResult } from '../../entities/ProductExtractionResult';
import { OfferQualityScore } from '../../entities/OfferQualityScore';

export type OfferStyle =
  | 'padrao'
  | 'explosiva'
  | 'premium'
  | 'urgencia'
  | 'minimalista'
  | 'emocional'
  | 'promocao'
  | 'custo_beneficio'
  | 'familia'
  | 'tecnologia'
  | 'casa'
  | 'esporte'
  | 'presentes'
  | 'relampago'
  | 'luxo';

export interface AIOfferResult {
  cta: string;
  hashtags: string[];
  emojis: string[];
  copies: {
    whatsAppText: string;
    telegramText: string;
    instagramText: string;
    facebookText: string;
    channelText: string;
    storyText: string;
  };
  analysis: {
    publicoAlvo: string;
    dorQueResolve: string;
    beneficioPrincipal: string;
    argumentoComercial: string;
    anguloDeVenda: string;
    emocaoDeCompra: string;
    categoria: string;
  };
  qualityScore: OfferQualityScore;
}

export interface IAIProvider {
  generateOffer(product: ProductExtractionResult, style: OfferStyle): Promise<AIOfferResult>;
}
