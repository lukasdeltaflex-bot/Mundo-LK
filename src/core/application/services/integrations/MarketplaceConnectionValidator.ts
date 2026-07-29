import {
  MarketplaceConnectionSlug,
  MarketplaceCredentials,
} from '../../../domain/entities/marketplace-connection.entity';

export interface LocalValidationResult {
  isValid: boolean;
  missingFields: string[];
  message?: string;
}

/**
 * MarketplaceConnectionValidator — Validador Local de Schemas (Release 2.2.8.2)
 *
 * Checa a presença dos campos mínimos obrigatórios ANTES de fazer chamadas de rede,
 * evitando requisições desnecessárias a APIs externas com dados incompletos.
 */
export class MarketplaceConnectionValidator {
  public static validateFields(
    slug: MarketplaceConnectionSlug,
    creds: MarketplaceCredentials
  ): LocalValidationResult {
    const missingFields: string[] = [];

    switch (slug) {
      case 'mercadolivre':
        if (!creds.clientId && !creds.accessToken) missingFields.push('Client ID ou Access Token');
        break;

      case 'shopee':
        if (!creds.partnerId) missingFields.push('Partner ID');
        if (!creds.partnerKey) missingFields.push('Partner Key');
        break;

      case 'amazon':
        if (!creds.clientId) missingFields.push('LWA Client ID');
        if (!creds.clientSecret) missingFields.push('LWA Client Secret');
        if (!creds.refreshToken) missingFields.push('Refresh Token SP-API');
        break;

      case 'gemini':
      case 'openai':
      case 'claude':
      case 'grok':
      case 'deepseek':
      case 'telegram':
      case 'bling':
        if (!creds.apiKey) missingFields.push('API Key / Bot Token');
        break;

      case 'whatsapp':
        if (!creds.phoneNumberId) missingFields.push('Phone Number ID');
        if (!creds.accessToken) missingFields.push('Access Token');
        break;

      case 'shopify':
        if (!creds.clientId) missingFields.push('Shop Domain');
        if (!creds.accessToken) missingFields.push('Admin API Access Token');
        break;

      default:
        // Caso não seja um canal conhecido, verifica se há ao menos 1 campo preenchido
        if (Object.keys(creds).length === 0) missingFields.push('Credencial obrigatória');
        break;
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      message:
        missingFields.length > 0
          ? `Credenciais incompletas. Os seguintes campos são obrigatórios: ${missingFields.join(', ')}.`
          : undefined,
    };
  }
}
