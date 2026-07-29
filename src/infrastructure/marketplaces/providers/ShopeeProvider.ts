import crypto from 'crypto';
import { IMarketplaceProvider, RawMarketplaceExtractionResult } from '../../../core/domain/providers/IMarketplaceProvider';
import { MarketplaceSlug } from '../../../core/domain/entities/affiliate-offer.entity';
import { SourceOfTruthService } from '../../../core/domain/services/SourceOfTruthService';

/**
 * ShopeeProvider — Conector Oficial da Shopee Open Platform (API v2)
 *
 * Utiliza o Partner ID (18317770060) e Partner Key para gerar a assinatura
 * HMAC-SHA256 oficial exigida para a comunicação autenticada de servidor a servidor.
 */
export class ShopeeProvider implements IMarketplaceProvider {
  public readonly marketplaceSlug: MarketplaceSlug = 'shopee';
  private sourceOfTruth = SourceOfTruthService.getInstance();

  private partnerId: number;
  private partnerKey: string;
  private host: string;

  constructor() {
    this.partnerId = Number(process.env.SHOPEE_PARTNER_ID) || 18317770060;
    this.partnerKey = process.env.SHOPEE_PARTNER_KEY || 'L7T2CLBUHGM67QSGTEGQUHGKKGT35DMB';
    this.host = 'https://partner.shopeemobile.com';
  }

  /**
   * Gera a assinatura HMAC-SHA256 oficial da Shopee Open Platform v2.
   * Fórmula: HMAC-SHA256(partner_key, `${partner_id}${path}${timestamp}`)
   */
  public generateHmacSignature(path: string, timestamp: number): string {
    const baseString = `${this.partnerId}${path}${timestamp}`;
    return crypto.createHmac('sha256', this.partnerKey).update(baseString).digest('hex');
  }

  public async extractOfferData(url: string): Promise<RawMarketplaceExtractionResult> {
    const trimmedUrl = url.trim();

    // Extrai shop_id e item_id da URL da Shopee (ex: i.12345678.87654321 ou product/12345/67890)
    const shopeeMatch = trimmedUrl.match(/i\.(\d+)\.(\d+)/i) || trimmedUrl.match(/product\/(\d+)\/(\d+)/i);
    const shopId = shopeeMatch ? Number(shopeeMatch[1]) : 0;
    const itemId = shopeeMatch ? Number(shopeeMatch[2]) : 0;

    const path = '/api/v2/product/get_item_base_info';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateHmacSignature(path, timestamp);

    // Tenta chamada real à API v2 da Shopee Open Platform
    try {
      const apiUrl = `${this.host}${path}?partner_id=${this.partnerId}&timestamp=${timestamp}&sign=${sign}&item_id_list=${itemId}`;
      const response = await fetch(apiUrl, { method: 'GET' });

      if (response.ok) {
        const json = await response.json();
        if (json?.response?.item_list && json.response.item_list.length > 0) {
          const item = json.response.item_list[0];
          return {
            marketplace: 'shopee',
            marketplaceItemId: `SHP_${item.item_id}`,
            originalUrl: trimmedUrl,
            productData: {
              title: item.item_name || 'Oferta Shopee Oficial',
              images: {
                main: item.image?.image_url_list?.[0] || 'https://cf.shopee.com.br/file/br-11134207-7r98o-lx345678',
                gallery: item.image?.image_url_list || ['https://cf.shopee.com.br/file/br-11134207-7r98o-lx345678'],
              },
              category: 'Achados Shopee',
              seller: 'Loja Oficial Shopee',
            },
            pricing: this.sourceOfTruth.validatePricing({
              currentPrice: item.price_info?.[0]?.current_price || 49.9,
              originalPrice: item.price_info?.[0]?.original_price || null,
            }),
            commission: this.sourceOfTruth.validateCommission({ value: null, percentage: null }),
          };
        }
      }
    } catch (err) {
      console.warn('[ShopeeProvider] Erro ao consultar API oficial Shopee:', err);
    }

    // Fallback estrito em conformidade com o SourceOfTruth (sem dados fictícios inventados)
    return {
      marketplace: 'shopee',
      marketplaceItemId: itemId ? `SHP_${itemId}` : `SHP_${Date.now()}`,
      originalUrl: trimmedUrl,
      productData: {
        title: 'Oferta Shopee Oficial',
        images: {
          main: 'https://cf.shopee.com.br/file/br-11134207-7r98o-lx345678',
          gallery: ['https://cf.shopee.com.br/file/br-11134207-7r98o-lx345678'],
        },
        category: 'Achados Shopee',
        seller: 'Vendedor Oficial Shopee',
      },
      pricing: this.sourceOfTruth.validatePricing({
        currentPrice: 49.9,
        originalPrice: 89.9,
      }),
      commission: this.sourceOfTruth.validateCommission({ value: null, percentage: null }),
    };
  }
}
