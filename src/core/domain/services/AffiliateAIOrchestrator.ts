import { AffiliateOffer, OfferContent } from '../entities/affiliate-offer.entity';
import { AIStrategyEngine } from './ai/AIStrategyEngine';
import { WhatsAppChannelGenerator } from './ai/WhatsAppChannelGenerator';
import { InstagramChannelGenerator } from './ai/InstagramChannelGenerator';
import { TikTokChannelGenerator } from './ai/TikTokChannelGenerator';
import { PinterestSEOChannelGenerator } from './ai/PinterestSEOChannelGenerator';

export interface AIQualityAuditResult {
  isValid: boolean;
  rejectionReason?: string;
}

export class AffiliateAIOrchestrator {
  private static instance: AffiliateAIOrchestrator;
  private strategyEngine = AIStrategyEngine.getInstance();

  private constructor() {}

  public static getInstance(): AffiliateAIOrchestrator {
    if (!AffiliateAIOrchestrator.instance) {
      AffiliateAIOrchestrator.instance = new AffiliateAIOrchestrator();
    }
    return AffiliateAIOrchestrator.instance;
  }

  /**
   * Orquestra a geração de conteúdo multicanal aplicando a trava de segurança e auditoria de qualidade.
   */
  public generateMultiChannelContent(offer: AffiliateOffer): OfferContent {
    // 1. Auditoria Prévia de Segurança do Link
    if (!offer.affiliateLink.verifyIntegrity()) {
      throw new Error('[AffiliateAIOrchestrator] ERRO DE SEGURANÇA: A integridade do link de afiliado está corrompida.');
    }

    // 2. Extração da Estratégia de Vendas
    const strategy = this.strategyEngine.analyzeOffer(offer);

    // 3. Geração de Conteúdo por Canal
    const whatsappCopy = WhatsAppChannelGenerator.generate(offer, strategy);
    const instagramCaption = InstagramChannelGenerator.generate(offer, strategy);
    const tiktokScript = TikTokChannelGenerator.generate(offer, strategy);
    const pinterestSEO = PinterestSEOChannelGenerator.generate(offer, strategy);

    const generatedContent: OfferContent = {
      whatsappCopy,
      instagramCaption,
      tiktokScript,
      hashtags: ['#Achadinhos', '#Promoção', '#ComprasOnline', `#${offer.marketplace}`],
      generatedAt: new Date().toISOString(),
    };

    // 4. Quality & Safety Audit Final
    const audit = this.validateAIOutput(offer, generatedContent);
    if (!audit.isValid) {
      throw new Error(`[AffiliateAIOrchestrator] CONTEÚDO REJEITADO PELA AUDITORIA: ${audit.rejectionReason}`);
    }

    // Atualiza a entidade Offer sem tocar nas propriedades imutáveis de preço ou link
    offer.setContent(generatedContent);

    return generatedContent;
  }

  /**
   * Valida se o conteúdo da IA não corrompeu preços confirmados nem inventou dados sensíveis.
   */
  public validateAIOutput(offer: AffiliateOffer, content: OfferContent): AIQualityAuditResult {
    // Validação 1: O link de afiliado deve estar 100% preservado no texto do WhatsApp
    if (!content.whatsappCopy || !content.whatsappCopy.includes(offer.affiliateLink.affiliateUrl)) {
      return {
        isValid: false,
        rejectionReason: 'A URL de afiliado protegida não foi encontrada no conteúdo gerado para WhatsApp.',
      };
    }

    // Validação 2: O preço citado no texto deve ser idêntico ao preço confirmado
    const priceFormatted = offer.pricing.currentPrice.toFixed(2);
    if (!content.whatsappCopy.includes(priceFormatted)) {
      return {
        isValid: false,
        rejectionReason: `O preço no texto da IA (R$ ${priceFormatted}) não corresponde ao preço confirmado da oferta.`,
      };
    }

    return { isValid: true };
  }
}
