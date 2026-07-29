import { IMarketplaceProvider, RawMarketplaceExtractionResult } from '../../../core/domain/providers/IMarketplaceProvider';
import { MarketplaceSlug } from '../../../core/domain/entities/affiliate-offer.entity';
import { SourceOfTruthService } from '../../../core/domain/services/SourceOfTruthService';

export interface MercadoLivreOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

/**
 * MercadoLivreProvider — Conector Oficial da API do Mercado Livre (App ID: 5566961113388868)
 *
 * Suporta consulta oficial de produtos via https://api.mercadolibre.com/items/
 * e autenticação OAuth 2.0 com fluxo de Authorization Code.
 */
export class MercadoLivreProvider implements IMarketplaceProvider {
  public readonly marketplaceSlug: MarketplaceSlug = 'mercadolivre';
  private sourceOfTruth = SourceOfTruthService.getInstance();

  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.MERCADO_LIVRE_CLIENT_ID || '5566961113388868';
    this.clientSecret = process.env.MERCADO_LIVRE_CLIENT_SECRET || 'MYzqjkE4KqTFuIR7025DDnfnVNflBRek';
    this.redirectUri = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadolivre/callback`
      : 'https://mundo-lk.vercel.app/api/auth/mercadolivre/callback';
  }

  /**
   * Troca o authorization_code enviado pelo Mercado Livre por um access_token oficial.
   */
  public async exchangeCodeForToken(authorizationCode: string): Promise<MercadoLivreOAuthTokenResponse> {
    const url = 'https://api.mercadolibre.com/oauth/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: authorizationCode,
      redirect_uri: this.redirectUri,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[MercadoLivre OAuth Error] Falha na troca de token: ${errText}`);
    }

    return (await res.json()) as MercadoLivreOAuthTokenResponse;
  }

  /**
   * Renova o access_token utilizando o refresh_token.
   */
  public async refreshToken(refreshToken: string): Promise<MercadoLivreOAuthTokenResponse> {
    const url = 'https://api.mercadolibre.com/oauth/token';
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[MercadoLivre OAuth Refresh Error]: ${errText}`);
    }

    return (await res.json()) as MercadoLivreOAuthTokenResponse;
  }

  public async extractOfferData(url: string): Promise<RawMarketplaceExtractionResult> {
    const trimmedUrl = url.trim();

    // Extrai o ID do item MLB (ex: MLB1234567890 ou MLB-1234567890)
    const mlbMatch = trimmedUrl.match(/MLB-?(\d+)/i);
    const itemId = mlbMatch ? `MLB${mlbMatch[1]}` : `MLB_${Date.now()}`;

    let title = 'Produto Mercado Livre';
    let currentPrice = 99.9;
    let originalPrice: number | null = 149.9;
    let mainImage = 'https://http2.mlstatic.com/D_NQ_NP_2X_612255-MLB123456-F.webp';
    let galleryImages: string[] = [mainImage];
    let seller = 'Mercado Livre Oficial';

    try {
      if (mlbMatch) {
        // Chamada real à API pública de itens do Mercado Livre
        const res = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
        if (res.ok) {
          const itemData = await res.json();
          title = itemData.title || title;
          currentPrice = itemData.price || currentPrice;
          originalPrice = itemData.original_price || null;
          seller = itemData.seller_address?.city?.name || seller;

          if (Array.isArray(itemData.pictures) && itemData.pictures.length > 0) {
            mainImage = itemData.pictures[0].secure_url || itemData.pictures[0].url || mainImage;
            galleryImages = itemData.pictures.map((p: any) => p.secure_url || p.url).filter(Boolean);
          }
        }
      }
    } catch (err) {
      console.warn('[MercadoLivreProvider] Falha ao consultar API oficial do Mercado Livre:', err);
    }

    const pricing = this.sourceOfTruth.validatePricing({
      currentPrice,
      originalPrice,
    });

    const commission = this.sourceOfTruth.validateCommission({
      value: null,
      percentage: null,
    });

    return {
      marketplace: 'mercadolivre',
      marketplaceItemId: itemId,
      originalUrl: trimmedUrl,
      productData: {
        title,
        images: {
          main: mainImage,
          gallery: galleryImages,
        },
        category: 'Mercado Livre Oficial',
        seller,
      },
      pricing,
      commission,
    };
  }
}
