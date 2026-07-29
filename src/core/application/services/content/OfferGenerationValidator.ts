export interface OfferGenerationValidationInput {
  title: string;
  price: number;
  imageUrl?: string;
  affiliateUrl: string;
}

export interface OfferGenerationValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * OfferGenerationValidator — Validador de Pré-Geração de IA (Release 2.2.8.1)
 *
 * Checa integridade de dados do produto e da URL de afiliado antes de acionar Gemini ou OpenAI.
 */
export class OfferGenerationValidator {
  public static validate(input: OfferGenerationValidationInput): OfferGenerationValidationResult {
    const errors: string[] = [];

    if (!input.title || input.title.trim().length < 3) {
      errors.push('Título do produto é obrigatório.');
    }

    if (input.price === undefined || input.price <= 0) {
      errors.push('Preço válido é obrigatório.');
    }

    if (!input.affiliateUrl || !input.affiliateUrl.startsWith('http')) {
      errors.push('URL de afiliado válida é obrigatória.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
