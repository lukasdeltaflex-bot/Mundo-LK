import { Price } from '../value-objects/price.vo';
import { ProductIdentityResolver } from './ProductIdentityResolver';
import { OFFICIAL_TAXONOMY_CATEGORIES } from '../entities/product.entity';

export interface ParsedReadyOffer {
  rawText: string;
  whatsAppText: string;
  url: string;
  price: number;
  title: string;
  marketplaceSlug: string;
  suggestedCategory: string;
}

export class ReadyOfferParserService {
  private identityResolver = new ProductIdentityResolver();

  /**
   * Deterministically parses a ready-made offer text pasted by the user.
   * DOES NOT MAKE ANY AI CALLS.
   * PRESERVES THE ORIGINAL COPY 100% INTACT.
   */
  public parse(rawText: string): ParsedReadyOffer {
    const text = (rawText || '').trim();
    if (!text) {
      return {
        rawText: '',
        whatsAppText: '',
        url: '',
        price: 0,
        title: '',
        marketplaceSlug: 'shopee',
        suggestedCategory: 'Geral',
      };
    }

    // 1. Extrai a primeira URL válida encontrada
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urlMatch = urlRegex.exec(text);
    const extractedUrl = urlMatch ? urlMatch[0].replace(/[.,;:!?)]+$/, '') : '';

    // 2. Extrai o preço em formato R$ ou numérico BRL
    let extractedPrice = 0;
    const priceRegex = /R\$\s*([\d\.,]+)/i;
    const priceMatch = priceRegex.exec(text);

    if (priceMatch && priceMatch[1]) {
      extractedPrice = Price.parseBRL(priceMatch[1]);
    } else {
      // Tenta fallback com valores numéricos soltos após palavras-chave como "por", "apenas"
      const fallbackPriceRegex = /(?:por|apenas|só|so)\s*R?\$?\s*([\d\.,]+)/i;
      const fallbackMatch = fallbackPriceRegex.exec(text);
      if (fallbackMatch && fallbackMatch[1]) {
        extractedPrice = Price.parseBRL(fallbackMatch[1]);
      }
    }

    // 3. Extrai o título: Primeira linha limpa que não seja apenas emoji ou preço/URL
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let extractedTitle = '';

    for (const line of lines) {
      // Remove emojis do início para checar relevância
      const cleanLine = line.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
      
      // Pula linhas que contêm apenas a URL ou apenas a tag de preço
      if (cleanLine.toLowerCase().includes('http') || /^R\$\s*[\d\.,]+/i.test(cleanLine)) {
        continue;
      }

      if (cleanLine.length > 5) {
        extractedTitle = cleanLine;
        break;
      }
    }

    if (!extractedTitle && lines.length > 0) {
      extractedTitle = lines[0].replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    }

    // 4. Identificação de Marketplace via URL Resolver Oficial
    let marketplaceSlug = 'shopee';
    if (extractedUrl) {
      try {
        const resolvedKey = this.identityResolver.resolveCanonicalKey(extractedUrl);
        if (resolvedKey && resolvedKey.marketplaceSlug) {
          marketplaceSlug = resolvedKey.marketplaceSlug;
        }
      } catch {
        if (extractedUrl.includes('amazon')) marketplaceSlug = 'amazon';
        else if (extractedUrl.includes('mercadolivre') || extractedUrl.includes('mercadolibre')) marketplaceSlug = 'mercadolivre';
        else if (extractedUrl.includes('magazineluiza') || extractedUrl.includes('magalu')) marketplaceSlug = 'magalu';
        else if (extractedUrl.includes('shein')) marketplaceSlug = 'shein';
      }
    }

    // 5. Sugestão de Categoria simples por palavras-chave na taxonomia
    let suggestedCategory = 'Geral';
    const textLower = text.toLowerCase();

    for (const cat of OFFICIAL_TAXONOMY_CATEGORIES) {
      const keywords = cat.toLowerCase().split(/[\s&]+/);
      if (keywords.some(kw => kw.length > 3 && textLower.includes(kw))) {
        suggestedCategory = cat;
        break;
      }
    }

    return {
      rawText: text,
      whatsAppText: text, // Preservado 100% sem alterações!
      url: extractedUrl,
      price: extractedPrice,
      title: extractedTitle || 'Oferta sem título',
      marketplaceSlug,
      suggestedCategory,
    };
  }
}
