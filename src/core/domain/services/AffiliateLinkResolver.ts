import { AffiliateLink, TrackingParameters } from '../entities/affiliate-link.entity';

export class AffiliateLinkResolver {
  private static instance: AffiliateLinkResolver;

  private constructor() {}

  public static getInstance(): AffiliateLinkResolver {
    if (!AffiliateLinkResolver.instance) {
      AffiliateLinkResolver.instance = new AffiliateLinkResolver();
    }
    return AffiliateLinkResolver.instance;
  }

  /**
   * Constrói e protege a entidade AffiliateLink preservando todos os parâmetros de rastreamento do usuário.
   */
  public resolve(params: {
    originalMarketplaceUrl: string;
    userAffiliateUrl: string;
    trackingParams?: TrackingParameters;
  }): AffiliateLink {
    const originalUrl = params.originalMarketplaceUrl.trim();
    let affiliateUrl = params.userAffiliateUrl.trim();

    // Se o usuário passou parâmetros de rastreamento adicionais, anexa sem remover os existentes
    if (params.trackingParams && Object.keys(params.trackingParams).length > 0) {
      try {
        const urlObj = new URL(affiliateUrl);
        Object.entries(params.trackingParams).forEach(([k, v]) => {
          if (v && !urlObj.searchParams.has(k)) {
            urlObj.searchParams.append(k, v);
          }
        });
        affiliateUrl = urlObj.toString();
      } catch (err) {
        console.warn('[AffiliateLinkResolver] Erro ao estender URL com tracking parameters:', err);
      }
    }

    return new AffiliateLink({
      originalMarketplaceUrl: originalUrl,
      affiliateUrl,
      trackingParameters: params.trackingParams || {},
    });
  }

  /**
   * Prepara um payload seguro para a IA.
   * A IA recebe a affiliateUrl apenas como LEITURA e não tem permissão para alterá-la.
   */
  public prepareAIPayload(link: AffiliateLink): { affiliateUrl: string; isProtected: true } {
    if (!link.verifyIntegrity()) {
      throw new Error('[AffiliateLinkResolver] ALERTA DE SEGURANÇA: A integridade do link de afiliado foi violada.');
    }

    return {
      affiliateUrl: link.affiliateUrl,
      isProtected: true,
    };
  }
}
