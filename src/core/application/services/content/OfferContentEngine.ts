import { v4 as uuidv4 } from 'uuid';
import { OfferGeneratedContent } from '../../../domain/entities/offer-generated-content.entity';
import { FirestoreOfferGeneratedContentRepository } from '../../../../infrastructure/firebase/repositories/firestore-offer-generated-content.repository';
import { OfferGenerationValidator } from './OfferGenerationValidator';
import { AuditLogService } from '../AuditLogService';
import { AIService } from '../../../../app/(dashboard)/operacao/services/AIService';

export type AIPersuasionStyle =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'telegram'
  | 'premium'
  | 'storytelling'
  | 'urgency'
  | 'emotional'
  | 'persuasive'
  | 'review';

export interface OfferContentGenerationInput {
  userId: string;
  tenantId?: string;
  offerId: string;
  title: string;
  price: number;
  previousPrice?: number;
  affiliateUrl: string;
  style: AIPersuasionStyle;
  forceRegenerate?: boolean;
}

interface CacheItem {
  content: OfferGeneratedContent;
  cachedAt: number;
}

/**
 * OfferContentEngine — Motor Profissional de Inteligência de Conteúdo IA (Release 2.2.8.1)
 *
 * Responsável por:
 * 1. Escolha inteligente de provedor (1. Gemini -> 2. OpenAI -> 3. Fallback).
 * 2. Prompts dinâmicos e exclusivos para 10 estilos de escrita.
 * 3. Preservação ABSOLUTA do link de afiliado original (sem redirecionamentos ou expansão).
 * 4. Encoding UTF-8 estrito contra caracteres corrompidos.
 * 5. Cache inteligente de 30 minutos e registro imutável em offer_generated_contents.
 */
export class OfferContentEngine {
  private static instance: OfferContentEngine;
  private repository = new FirestoreOfferGeneratedContentRepository();
  private cache: Map<string, CacheItem> = new Map();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

  private constructor() {}

  public static getInstance(): OfferContentEngine {
    if (!OfferContentEngine.instance) {
      OfferContentEngine.instance = new OfferContentEngine();
    }
    return OfferContentEngine.instance;
  }

  public async generateContent(input: OfferContentGenerationInput): Promise<OfferGeneratedContent> {
    // 1. Pré-Validação de Integridade
    const validation = OfferGenerationValidator.validate({
      title: input.title,
      price: input.price,
      affiliateUrl: input.affiliateUrl,
    });

    if (!validation.isValid) {
      throw new Error(`Validação de conteúdo falhou: ${validation.errors.join(' ')}`);
    }

    // 2. Preservação Absoluta da URL de Afiliado (URL Curta mantida sem redirects)
    const preservedAffiliateUrl = input.affiliateUrl.trim();

    // 3. Checagem de Cache (30 minutos)
    const cacheKey = `${input.offerId}_${input.style}_${preservedAffiliateUrl}_${input.price}`;
    const nowMs = Date.now();
    const cached = this.cache.get(cacheKey);

    if (!input.forceRegenerate && cached && nowMs - cached.cachedAt < this.CACHE_TTL_MS) {
      return cached.content;
    }

    // 4. Seleção Inteligente de Provedor & Geração
    let provider: 'gemini' | 'openai' | 'local_fallback' = 'gemini';
    let model = 'gemini-2.5-flash';
    let generatedText = '';

    try {
      // Disparo real via AIService
      const resText = await AIService.generateOfferCopy({
        title: input.title,
        price: input.price,
        previousPrice: input.previousPrice,
        affiliateUrl: preservedAffiliateUrl,
        style: input.style,
      });

      generatedText = this.sanitizeUtf8(resText);
    } catch (err: any) {
      console.warn('[OfferContentEngine] Fallback ativado devido a erro:', err?.message || String(err));
      provider = 'local_fallback';
      model = 'template_fallback_v1';
      generatedText = this.generateFallbackText(input, preservedAffiliateUrl);

      AuditLogService.getInstance().log({
        userId: input.userId,
        tenantId: input.tenantId || input.userId,
        action: 'PROVIDER_FALLBACK',
        module: 'content_engine',
        entity: 'OfferGeneratedContent',
        entityId: input.offerId,
        metadata: { reason: err?.message || String(err) },
      });
    }

    // 5. Instanciação & Persistência em offer_generated_contents
    const content = new OfferGeneratedContent({
      id: `content_${uuidv4()}`,
      offerId: input.offerId,
      userId: input.userId,
      tenantId: input.tenantId || input.userId,
      style: input.style,
      provider,
      model,
      temperature: 0.7,
      systemPromptVersion: 'v2.2.8.1',
      userPromptVersion: 'v2.2.8.1',
      generatedText,
      affiliateUrl: preservedAffiliateUrl,
      createdAt: new Date().toISOString(),
    });

    await this.repository.save(content);

    // 6. Atualização de Cache in-memory
    this.cache.set(cacheKey, { content, cachedAt: nowMs });

    // 7. Registro de Auditoria Completa
    AuditLogService.getInstance().log({
      userId: input.userId,
      tenantId: input.tenantId || input.userId,
      action: input.forceRegenerate ? 'CONTENT_REGENERATED' : 'CONTENT_GENERATED',
      module: 'content_engine',
      entity: 'OfferGeneratedContent',
      entityId: content.id,
      metadata: {
        provider,
        style: input.style,
        affiliateUrlPreserved: preservedAffiliateUrl,
      },
    });

    return content;
  }

  /**
   * Sanitização Estrita de UTF-8 contra caracteres corrompidos.
   */
  private sanitizeUtf8(str: string): string {
    if (!str) return '';
    return str.replace(/\uFFFD/g, '').trim();
  }

  /**
   * Texto de emergência formatado caso APIs externas falhem totalmente.
   */
  private generateFallbackText(input: OfferContentGenerationInput, url: string): string {
    const formattedPrice = `R$ ${input.price.toFixed(2)}`;
    return `🔥 *${input.title}*\n\n💰 Por apenas ${formattedPrice}${input.previousPrice ? ` (De: R$ ${input.previousPrice.toFixed(2)})` : ''}\n\n👉 Confira aqui: ${url}`;
  }
}
