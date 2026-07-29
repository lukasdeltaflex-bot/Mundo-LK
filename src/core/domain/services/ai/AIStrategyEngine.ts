import { AffiliateOffer } from '../../entities/affiliate-offer.entity';

export interface ProductStrategy {
  audience: string;
  mainBenefit: string;
  buyingTrigger: string;
  communicationTone: string;
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  contentAngle: string;
}

export class AIStrategyEngine {
  private static instance: AIStrategyEngine;

  private constructor() {}

  public static getInstance(): AIStrategyEngine {
    if (!AIStrategyEngine.instance) {
      AIStrategyEngine.instance = new AIStrategyEngine();
    }
    return AIStrategyEngine.instance;
  }

  /**
   * Analisa a oferta e extrai a estratégia de vendas personalizada para afiliados.
   */
  public analyzeOffer(offer: AffiliateOffer): ProductStrategy {
    const titleLower = offer.productData.title.toLowerCase();
    const categoryLower = offer.productData.category.toLowerCase();
    const hasDiscount = Boolean(offer.pricing.discountPercentage && offer.pricing.discountPercentage > 0);

    let audience = 'compradores em busca de ofertas e custo-benefício';
    let mainBenefit = 'excelente relação custo-benefício e entrega rápida';
    let buyingTrigger = 'oportunidade de economia imediata';
    let communicationTone = 'entusiasta, persuasivo e amigável';
    let urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW' = hasDiscount ? 'HIGH' : 'MEDIUM';
    let contentAngle = 'achadinho imperdível com desconto exclusivo';

    if (categoryLower.includes('cozinha') || titleLower.includes('air fryer') || titleLower.includes('panela')) {
      audience = 'pessoas buscando praticidade e agilidade no preparo de refeições diárias';
      mainBenefit = 'economia de tempo na cozinha e refeições mais saudáveis';
      buyingTrigger = 'praticidade com super desconto';
      contentAngle = 'solução que vai transformar sua rotina na cozinha';
    } else if (categoryLower.includes('moda') || titleLower.includes('tênis') || titleLower.includes('roupa')) {
      audience = 'pessoas atentas a estilo, conforto e tendências de moda';
      mainBenefit = 'estilo marcante com o menor preço garantido';
      buyingTrigger = 'estoque limitado nos tamanhos mais procurados';
      contentAngle = 'look perfeito com desconto inacreditável';
    } else if (categoryLower.includes('eletrônico') || titleLower.includes('fone') || titleLower.includes('celular')) {
      audience = 'entusiastas de tecnologia e utilidades inteligentes';
      mainBenefit = 'tecnologia avançada com custo-benefício imbatível';
      buyingTrigger = 'cupom por tempo limitado';
      contentAngle = 'upgrade tecnológico com preço de liquidação';
    }

    return {
      audience,
      mainBenefit,
      buyingTrigger,
      communicationTone,
      urgencyLevel,
      contentAngle,
    };
  }
}
