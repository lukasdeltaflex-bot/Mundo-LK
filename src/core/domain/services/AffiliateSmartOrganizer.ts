import { GeminiAIAdapter, OfferStyle } from '@/infrastructure/ai/providers/gemini.adapter';
import { Product } from '@/core/domain/entities/product.entity';
import { Price } from '@/core/domain/value-objects/price.vo';
import { AffiliateLink } from '@/core/domain/value-objects/affiliate-link.vo';
import { DiscountPercentage } from '@/core/domain/value-objects/discount-percentage.vo';

export type AIConfidenceLevel = 'ALTA_CONFIANCA' | 'MEDIA_CONFIANCA' | 'BAIXA_CONFIANCA';

export interface OfferVersionEntry {
  version: number;
  timestamp: string;
  author: 'IA_GEMINI' | 'USUARIO';
  category: string;
  subcategory: string;
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  tags: string[];
  notes?: string;
}

export interface SmartOrganizationResult {
  category: string;
  subcategory: string;
  brand: string;
  tags: string[];
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  potentialLevel: 'ALTO' | 'MEDIO' | 'BAIXO';
  confidenceLevel: AIConfidenceLevel;
  confidenceScore: number; // 0 a 100
  isUserValidated: boolean;
  versionHistory: OfferVersionEntry[];
}

export class AffiliateSmartOrganizer {
  private static instance: AffiliateSmartOrganizer;
  private geminiAdapter = new GeminiAIAdapter();

  private constructor() {}

  public static getInstance(): AffiliateSmartOrganizer {
    if (!AffiliateSmartOrganizer.instance) {
      AffiliateSmartOrganizer.instance = new AffiliateSmartOrganizer();
    }
    return AffiliateSmartOrganizer.instance;
  }

  /**
   * Executa a análise inicial por IA (Etapa 1 do Fluxo) gerando sugestões com indicador de confiança.
   */
  public async analyzeAndOrganize(params: {
    title: string;
    price: number;
    previousPrice?: number;
    url: string;
    existingData?: Partial<SmartOrganizationResult>;
  }): Promise<SmartOrganizationResult> {
    // REGRA DE SEGURANÇA 1: Se o usuário já validou manualmente, NUNCA sobrescrever
    if (params.existingData && params.existingData.isUserValidated) {
      console.log('[AffiliateSmartOrganizer] 🔒 TRAVA HUMANA ATIVA: Oferta já validada pelo usuário. Sugestão da IA ignorada.');
      return params.existingData as SmartOrganizationResult;
    }

    const currPrice = Price.create(params.price);
    const prevPrice = params.previousPrice ? Price.create(params.previousPrice) : null;

    const productEntity = new Product({
      id: `prod_organizer_${Date.now()}`,
      userId: 'usr_organizer',
      title: params.title,
      description: params.title,
      brand: 'Marca Sugerida',
      categoryId: 'cat_geral',
      marketplaceSlug: params.url.includes('shopee') ? 'shopee' : 'mercadolivre',
      originalUrl: params.url,
      affiliateUrl: AffiliateLink.create(params.url),
      currentPrice: currPrice,
      previousPrice: prevPrice,
      discountPercentage: DiscountPercentage.calculate(currPrice, prevPrice),
      images: ['https://http2.mlstatic.com/D_NQ_NP_2X_612255-F.webp'],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      const aiResult = await this.geminiAdapter.generateOfferContent(productEntity, 'explosiva');
      const analysis = aiResult.analysis || {
        categoria: 'Achados Gerais',
        subcategoria: 'Geral',
        hashtags: ['#Achadinhos', '#Promoção'],
        scoreValue: 85,
      };

      const category = analysis.categoria || 'Achados Gerais';
      const subcategory = analysis.subcategoria || 'Geral';
      const tags = analysis.hashtags && analysis.hashtags.length > 0
        ? analysis.hashtags.map((t) => t.replace('#', ''))
        : ['Achadinhos', 'Promoção'];

      const scoreVal = analysis.scoreValue || 85;
      const confidenceLevel: AIConfidenceLevel =
        scoreVal >= 80 ? 'ALTA_CONFIANCA' : scoreVal >= 50 ? 'MEDIA_CONFIANCA' : 'BAIXA_CONFIANCA';

      const initialVersion: OfferVersionEntry = {
        version: 1,
        timestamp: new Date().toISOString(),
        author: 'IA_GEMINI',
        category,
        subcategory,
        priority: scoreVal >= 80 ? 'ALTA' : 'MEDIA',
        tags,
        notes: `Classificação automática Gemini 2.5 Flash (${scoreVal}% de confiança)`,
      };

      return {
        category,
        subcategory,
        brand: 'Oficial',
        tags,
        priority: scoreVal >= 80 ? 'ALTA' : 'MEDIA',
        potentialLevel: scoreVal >= 85 ? 'ALTO' : 'MEDIO',
        confidenceLevel,
        confidenceScore: scoreVal,
        isUserValidated: false,
        versionHistory: [initialVersion],
      };
    } catch (err) {
      console.warn('[AffiliateSmartOrganizer] Falha na análise de IA, executando classificação padrão:', err);

      return {
        category: 'Achados Gerais',
        subcategory: 'Geral',
        brand: 'Oficial',
        tags: ['Achadinhos', 'Promoção'],
        priority: 'MEDIA',
        potentialLevel: 'MEDIO',
        confidenceLevel: 'MEDIA_CONFIANCA',
        confidenceScore: 70,
        isUserValidated: false,
        versionHistory: [],
      };
    }
  }

  /**
   * Validação Humana / Correção Manual (Etapa 2 do Fluxo):
   * Grava as alterações do usuário e ATIVA A TRAVA INEGOCIÁVEL (isUserValidated = true).
   */
  public applyUserValidation(
    currentData: SmartOrganizationResult,
    userPatch: Partial<SmartOrganizationResult>
  ): SmartOrganizationResult {
    const nextVersionNumber = (currentData.versionHistory?.length || 0) + 1;

    const userVersion: OfferVersionEntry = {
      version: nextVersionNumber,
      timestamp: new Date().toISOString(),
      author: 'USUARIO',
      category: userPatch.category || currentData.category,
      subcategory: userPatch.subcategory || currentData.subcategory,
      priority: userPatch.priority || currentData.priority,
      tags: userPatch.tags || currentData.tags,
      notes: 'Alteração manual validada pelo afiliado',
    };

    return {
      ...currentData,
      ...userPatch,
      isUserValidated: true, // 🔒 TRAVA ATIVA PERMANENTEMENTE
      versionHistory: [userVersion, ...(currentData.versionHistory || [])],
    };
  }

  /**
   * Reclassificação por IA sob demanda (ativada exclusivamente se o usuário clicar em "Reclassificar com IA").
   */
  public async reclassifyWithAI(params: {
    title: string;
    price: number;
    previousPrice?: number;
    url: string;
    currentData: SmartOrganizationResult;
  }): Promise<SmartOrganizationResult> {
    const updated = await this.analyzeAndOrganize({
      ...params,
      existingData: undefined, // Ignora a trava para permitir a reclassificação sob demanda
    });

    const nextVersionNumber = (params.currentData.versionHistory?.length || 0) + 1;
    const reclassVersion: OfferVersionEntry = {
      version: nextVersionNumber,
      timestamp: new Date().toISOString(),
      author: 'IA_GEMINI',
      category: updated.category,
      subcategory: updated.subcategory,
      priority: updated.priority,
      tags: updated.tags,
      notes: 'Reclassificação sob demanda ativada pelo afiliado',
    };

    return {
      ...updated,
      versionHistory: [reclassVersion, ...(params.currentData.versionHistory || [])],
    };
  }
}
