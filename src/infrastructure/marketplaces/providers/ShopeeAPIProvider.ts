import crypto from 'crypto';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import {
  getShopeeApiConfig,
  getSafeShopeeConfigLog,
  ShopeeApiConfig,
} from '../config/shopee-api.config';

/**
 * Authenticated Provider for Official Shopee API.
 * Uses centralized configuration and secure HMAC-SHA256 signatures.
 */
export class ShopeeAPIProvider {
  public readonly name = 'ShopeeAPI';
  private config: ShopeeApiConfig;

  constructor() {
    this.config = getShopeeApiConfig();
    const safeLog = getSafeShopeeConfigLog();
    console.log(
      `[ShopeeAPIProvider] 🔐 Configuração Inicializada — AppID: ${safeLog.appId}, SecretKey: ${safeLog.secretMasked}, Status: ${safeLog.isEnabled ? 'ATIVO' : 'INATIVO'}`
    );
  }

  /**
   * Generates HMAC-SHA256 signature for Shopee Open API authentication.
   */
  private generateSignature(path: string, timestamp: number, accessToken: string = ''): string {
    const message = `${this.config.appId}${path}${timestamp}${accessToken}`;
    return crypto.createHmac('sha256', this.config.secretKey).update(message).digest('hex');
  }

  /**
   * Extracts shopId and itemId from canonical or expanded Shopee URL.
   */
  private extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
    const m1 = url.match(/\.i\.(\d+)\.(\d+)/);
    if (m1) return { shopId: m1[1], itemId: m1[2] };

    const m2 = url.match(/\/product\/(\d+)\/(\d+)/);
    if (m2) return { shopId: m2[1], itemId: m2[2] };

    return null;
  }

  public async extract(url: string, marketplaceSlug: string): Promise<Partial<ProductExtractionResult> | null> {
    if (marketplaceSlug !== 'shopee' && !/shopee\.com\.br|shope\.ee|shp\.ee|s\.shopee\.com\.br/i.test(url)) {
      return null;
    }

    if (!this.config.isEnabled) {
      console.warn('[ShopeeAPIProvider] ⚠️ Provider desativado ou credenciais não configuradas.');
      return null;
    }

    const ids = this.extractShopeeIds(url);
    if (!ids) {
      console.warn(`[ShopeeAPIProvider] ⚠️ Não foi possível extrair (shopId, itemId) da URL: ${url}`);
      return null;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v4/item/get';
    const signature = this.generateSignature(path, timestamp);

    const safeLog = getSafeShopeeConfigLog();
    console.log(
      `[ShopeeAPIProvider] 🚀 Requisição Autenticada — AppID: ${safeLog.appId}, shopId: ${ids.shopId}, itemId: ${ids.itemId}, timestamp: ${timestamp}, signature: ${signature.slice(0, 8)}...`
    );

    try {
      const endpoint = `https://shopee.com.br/api/v4/item/get?itemid=${ids.itemId}&shopid=${ids.shopId}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7_000);

      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://shopee.com.br/',
          'x-api-source': 'pc',
          'x-shopee-language': 'pt',
          'x-shopee-partner-id': this.config.appId,
          'x-shopee-signature': signature,
          'x-shopee-timestamp': String(timestamp),
        },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[ShopeeAPIProvider] ⚠️ HTTP status ${res.status} retornado para itemId=${ids.itemId}`);
        return null;
      }

      const json = (await res.json()) as Record<string, unknown>;
      const data = (json as Record<string, Record<string, unknown>>)['data'];
      if (!data) return null;

      const title = String(data['name'] || '').trim();
      if (!title || title.length < 3) return null;

      const currentPrice = typeof data['price'] === 'number' ? (data['price'] as number) / 100000 : null;
      const originalPrice =
        typeof data['price_before_discount'] === 'number' && (data['price_before_discount'] as number) > 0
          ? (data['price_before_discount'] as number) / 100000
          : null;

      const rawImages = (data['images'] as string[] | undefined) || [];
      const image = rawImages[0] ? `https://cf.shopee.com.br/file/${rawImages[0]}` : '';
      const gallery = rawImages.map((img) => `https://cf.shopee.com.br/file/${img}`);

      const description = String(data['description'] || '').slice(0, 500);
      const brand = String(data['brand'] || 'Shopee');
      const category = String(data['category'] || 'Geral');

      const discountPercentage =
        originalPrice && currentPrice && originalPrice > currentPrice
          ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
          : 0;

      console.log(`[ShopeeAPIProvider] ✅ Sucesso! Produto retornado: "${title}" (Preço: R$ ${currentPrice})`);

      return {
        title,
        description,
        currentPrice: currentPrice ?? 0,
        originalPrice,
        discountPercentage,
        brand,
        category,
        image,
        gallery,
        marketplace: 'shopee',
        productId: `shopee_${ids.shopId}_${ids.itemId}`,
        freeShipping: true,
        canonicalUrl: url,
        originalUrl: url,
      };
    } catch (err) {
      console.error('[ShopeeAPIProvider] ❌ Exceção na requisição autenticada Shopee:', err);
      return null;
    }
  }
}
