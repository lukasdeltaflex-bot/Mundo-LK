import { GeminiOfferAnalysis } from '@/infrastructure/ai/providers/gemini.adapter';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedAnalysis: GeminiOfferAnalysis;
}

export class AIResponseValidatorService {
  public static validateResponse(
    rawAnalysis: Partial<GeminiOfferAnalysis>,
    expectedAffiliateUrl: string
  ): ValidationResult {
    const errors: string[] = [];

    if (!rawAnalysis || typeof rawAnalysis !== 'object') {
      return {
        isValid: false,
        errors: ['Resposta da IA não é um objeto JSON válido.'],
        sanitizedAnalysis: rawAnalysis as any,
      };
    }

    if (!rawAnalysis.whatsAppText || rawAnalysis.whatsAppText.trim().length < 20) {
      errors.push('Campo whatsAppText ausente ou muito curto.');
    }

    if (!rawAnalysis.cta || rawAnalysis.cta.trim().length < 3) {
      errors.push('Campo cta ausente.');
    }

    // Preservação de link de afiliado
    if (expectedAffiliateUrl && rawAnalysis.whatsAppText && !rawAnalysis.whatsAppText.includes(expectedAffiliateUrl)) {
      console.warn('[AIResponseValidatorService] ⚠️ Link de afiliado ausente no texto gerado. Injetando link oficial automaticamente.');
      rawAnalysis.whatsAppText = `${rawAnalysis.whatsAppText.trim()}\n\n🛒 ${expectedAffiliateUrl}`;
    }

    const sanitizedAnalysis: GeminiOfferAnalysis = {
      publicoAlvo: rawAnalysis.publicoAlvo || 'Consumidores em geral',
      dorQueResolve: rawAnalysis.dorQueResolve || 'Garantir produto oficial pelo menor preço',
      beneficioPrincipal: rawAnalysis.beneficioPrincipal || 'Alta utilidade e qualidade',
      argumentoComercial: rawAnalysis.argumentoComercial || 'Excelente oportunidade de compra',
      anguloDeVenda: rawAnalysis.anguloDeVenda || 'Custo-Benefício',
      emocaoDeCompra: rawAnalysis.emocaoDeCompra || 'Satisfação',
      categoria: rawAnalysis.categoria || 'Geral',
      subcategoria: rawAnalysis.subcategoria,

      whatsAppText: rawAnalysis.whatsAppText || '',
      telegramText: rawAnalysis.telegramText || rawAnalysis.whatsAppText || '',
      instagramText: rawAnalysis.instagramText || rawAnalysis.whatsAppText || '',
      facebookText: rawAnalysis.facebookText || rawAnalysis.whatsAppText || '',
      statusWhatsAppText: rawAnalysis.statusWhatsAppText || rawAnalysis.cta || '',

      copyA: rawAnalysis.copyA,
      copyB: rawAnalysis.copyB,
      copyC: rawAnalysis.copyC,

      cta: rawAnalysis.cta || 'Garanta o seu no link oficial!',
      hashtags: Array.isArray(rawAnalysis.hashtags) ? rawAnalysis.hashtags : ['#oferta'],
      emojis: Array.isArray(rawAnalysis.emojis) ? rawAnalysis.emojis : ['🔥'],
      gatilhosMentais: Array.isArray(rawAnalysis.gatilhosMentais) ? rawAnalysis.gatilhosMentais : ['Urgência'],

      autoAvaliacaoNota: rawAnalysis.autoAvaliacaoNota || 9.0,
      autoAvaliacaoJustificativa: rawAnalysis.autoAvaliacaoJustificativa || 'Análise válida.',
      sanitizedPromptDebug: rawAnalysis.sanitizedPromptDebug,

      scoreValue: rawAnalysis.scoreValue || 85,
      scoreJustification: rawAnalysis.scoreJustification || 'Oferta aprovada com sucesso.',
    };

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedAnalysis,
    };
  }
}
