export interface PublishValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PublishValidationInput {
  title: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  affiliateUrl: string;
}

/**
 * MarketplacePublishValidator — Validador de Pré-Publicação (Release 2.2.7)
 *
 * Executa checagens de integridade antes do envio aos marketplaces para evitar
 * rejeições de API (HTTP 400/422) decorrentes de campos inválidos ou incompletos.
 */
export class MarketplacePublishValidator {
  public static validate(input: PublishValidationInput): PublishValidationResult {
    const errors: string[] = [];

    if (!input.title || input.title.trim().length < 5) {
      errors.push('Título inválido (mínimo de 5 caracteres exigido).');
    }

    if (!input.price || input.price <= 0) {
      errors.push('Preço deve ser maior que R$ 0,00.');
    }

    if (input.stock === undefined || input.stock < 0) {
      errors.push('Estoque deve ser maior ou igual a 0.');
    }

    if (!input.affiliateUrl || !input.affiliateUrl.startsWith('http')) {
      errors.push('URL de afiliado/produto inválida.');
    }

    if (!input.imageUrl) {
      errors.push('Imagem principal do anúncio não informada.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
