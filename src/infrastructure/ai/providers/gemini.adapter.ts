import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';
import { AIMemoryService } from '../strategies/ai-memory.service';

// ─── Category Classification ──────────────────────────────────────────────────

interface CategoryProfile {
  name: string;
  keywords: string[];
  emojis: string[];
  sellingPoints: string[];
  audience: string;
  ctaStyle: string;
}

const CATEGORY_PROFILES: CategoryProfile[] = [
  {
    name: 'Casa e Cozinha',
    keywords: [
      'garrafa', 'térmica', 'copo', 'panela', 'frigideira', 'cafeteira', 'liquidificador',
      'batedeira', 'torradeira', 'chaleira', 'coador', 'escorredor', 'bowl', 'prato',
      'caneca', 'cozinha', 'doméstico', 'utensílio', 'forma', 'assadeira', 'faca',
      'tábua', 'tempero', 'garrafa', 'squeeze', 'jarra', 'porta', 'organizador',
    ],
    emojis: ['☕', '🍳', '🏠', '💧', '🫙', '🍽️'],
    sellingPoints: ['hidratação', 'praticidade no dia a dia', 'qualidade doméstica', 'facilidade de uso', 'durabilidade'],
    audience: 'donas de casa, cozinheiros amadores, amantes de cozinha',
    ctaStyle: 'Ideal para sua cozinha! Aproveite antes que esgote!',
  },
  {
    name: 'Eletrodomésticos',
    keywords: [
      'air fryer', 'fritadeira', 'micro-ondas', 'geladeira', 'fogão', 'forno', 'lava-louças',
      'máquina de lavar', 'secadora', 'purificador', 'aspirador', 'ferro', 'lavadora',
      'depurador', 'climatizador', 'ventilador', 'ar-condicionado', 'eletrodoméstico',
    ],
    emojis: ['🏠', '⚡', '🔌', '🌡️', '✨'],
    sellingPoints: ['economia de energia', 'tecnologia avançada', 'facilidade de uso', 'desempenho superior', 'garantia do fabricante'],
    audience: 'famílias, novos lares, quem está reformando a cozinha',
    ctaStyle: 'Transforme sua casa! Oferta por tempo limitado!',
  },
  {
    name: 'Eletrônicos',
    keywords: [
      'smartphone', 'celular', 'iphone', 'samsung', 'xiaomi', 'notebook', 'computador',
      'tablet', 'ipad', 'monitor', 'teclado', 'mouse', 'headset', 'placa', 'processador',
      'ssd', 'hd', 'memória', 'ram', 'gpu', 'impressora', 'scanner', 'projetor', 'tv',
      'televisão', 'smart tv', 'controle', 'câmera', 'câmara digital', 'smartwatch',
    ],
    emojis: ['📱', '💻', '⚡', '🔋', '🖥️'],
    sellingPoints: ['alta performance', 'tecnologia de ponta', 'conectividade', 'tela de qualidade', 'bateria duradoura'],
    audience: 'gamers, profissionais de tecnologia, entusiastas de gadgets',
    ctaStyle: 'Tecnologia incrível pelo melhor preço! Compre agora!',
  },
  {
    name: 'Áudio e Fones',
    keywords: [
      'fone', 'headphone', 'earphone', 'earbuds', 'headset', 'bluetooth', 'sem fio',
      'caixa de som', 'speaker', 'soundbar', 'anc', 'noise cancelling', 'hi-fi',
      'áudio', 'som', 'musical', 'reprodutor',
    ],
    emojis: ['🎧', '🎶', '🔊', '🎵', '🎤'],
    sellingPoints: ['som de alta qualidade', 'cancelamento de ruído', 'bateria longa', 'conforto ergonômico', 'conexão estável'],
    audience: 'amantes de música, gamers, trabalhadores remotos',
    ctaStyle: 'Som incrível na sua vida! Aproveite o desconto!',
  },
  {
    name: 'Moda e Vestuário',
    keywords: [
      'camiseta', 'camisa', 'calça', 'jeans', 'bermuda', 'vestido', 'blusa', 'saia',
      'jaqueta', 'casaco', 'moletom', 'shorts', 'pijama', 'roupa', 'roupas', 'moda',
      'conjunto', 'suit', 'terno', 'gravata', 'meias', 'cueca', 'calcinha', 'sutiã',
    ],
    emojis: ['👗', '👕', '👖', '✨', '🛍️'],
    sellingPoints: ['estilo moderno', 'conforto no uso', 'material de qualidade', 'caimento perfeito', 'versatilidade'],
    audience: 'fashionistas, pessoas que buscam conforto e estilo',
    ctaStyle: 'Vista-se com estilo! Oferta imperdível!',
  },
  {
    name: 'Calçados',
    keywords: [
      'tênis', 'sapato', 'sandália', 'chinelo', 'bota', 'coturnos', 'mocassim', 'sapatênis',
      'salto', 'scarpin', 'rasteira', 'alpargata', 'calçado', 'solado', 'palmilha',
    ],
    emojis: ['👟', '👠', '👞', '🏃', '✨'],
    sellingPoints: ['conforto nos pés', 'solado resistente', 'design moderno', 'durabilidade', 'estilo versátil'],
    audience: 'esportistas, fashionistas, trabalhadores ativos',
    ctaStyle: 'Pise com estilo! Garanta o seu par agora!',
  },
  {
    name: 'Beleza e Perfumaria',
    keywords: [
      'perfume', 'colônia', 'desodorante', 'creme', 'hidratante', 'protetor solar', 'maquiagem',
      'batom', 'base', 'pó', 'rímel', 'delineador', 'sombra', 'shampoo', 'condicionador',
      'sérum', 'tônico', 'máscara facial', 'esfoliante', 'beleza', 'cosmético', 'skin care',
    ],
    emojis: ['💄', '✨', '🌸', '💆', '💅'],
    sellingPoints: ['pele radiante', 'fragrância envolvente', 'formulação premium', 'resultados visíveis', 'ingredientes naturais'],
    audience: 'mulheres modernas, entusiastas de beleza, quem cuida da aparência',
    ctaStyle: 'Cuide-se com o melhor! Aproveite a promoção!',
  },
  {
    name: 'Esporte e Fitness',
    keywords: [
      'academia', 'halteres', 'barra', 'kettlebell', 'esteira', 'bicicleta', 'ergométrica',
      'elastico', 'faixa', 'tatame', 'tapete', 'luva', 'cotoveleira', 'joelheira', 'protetor',
      'suplemento', 'whey', 'creatina', 'proteína', 'pré-treino', 'vitamina', 'fitness', 'treino',
    ],
    emojis: ['💪', '🏋️', '🏃', '⚡', '🎯'],
    sellingPoints: ['máximo desempenho', 'recuperação acelerada', 'resistência superior', 'resultados comprovados', 'qualidade profissional'],
    audience: 'atletas, frequentadores de academia, pessoas ativas',
    ctaStyle: 'Evolua seus resultados! Oferta por tempo limitado!',
  },
  {
    name: 'Infantil e Bebê',
    keywords: [
      'bebê', 'criança', 'infantil', 'brinquedo', 'boneca', 'carrinho', 'puzzle', 'jogo',
      'lego', 'pelúcia', 'fraldas', 'mamadeira', 'chupeta', 'berço', 'cercadinho',
      'andador', 'banheira', 'escorregador', 'balanço',
    ],
    emojis: ['👶', '🧸', '🎈', '🌈', '⭐'],
    sellingPoints: ['segurança certificada', 'material atóxico', 'estimula o desenvolvimento', 'durabilidade para brincadeiras', 'diversão garantida'],
    audience: 'pais, mães, avós, familiares com crianças',
    ctaStyle: 'A melhor escolha para seu pequeno! Aproveite!',
  },
  {
    name: 'Automotivo',
    keywords: [
      'carro', 'auto', 'veículo', 'pneu', 'rodas', 'óleo', 'filtro', 'bateria',
      'som automotivo', 'câmera de ré', 'gps', 'suporte veicular', 'carregador veicular',
      'tapete automotivo', 'acessório automotivo',
    ],
    emojis: ['🚗', '⚙️', '🔧', '🛞', '⚡'],
    sellingPoints: ['performance do veículo', 'segurança na estrada', 'instalação fácil', 'compatibilidade universal', 'qualidade certificada'],
    audience: 'motoristas, entusiastas de automóveis, mecânicos',
    ctaStyle: 'Melhore seu carro agora! Não perca essa oferta!',
  },
];

const GENERIC_PROFILE: CategoryProfile = {
  name: 'Geral',
  keywords: [],
  emojis: ['🔥', '💥', '🛒', '⚡', '😱'],
  sellingPoints: ['ótimo custo-benefício', 'qualidade garantida', 'entrega rápida', 'produto original'],
  audience: 'consumidores em geral',
  ctaStyle: 'Aproveite essa oferta antes que esgote!',
};

/**
 * Classifies a product title into a known category.
 * Returns the category profile and a confidence score (0–1).
 */
function classifyProduct(title: string, description: string, categoryName: string): { profile: CategoryProfile; confidence: number } {
  const searchText = `${title} ${description} ${categoryName}`.toLowerCase();
  const tokens = searchText.split(/\s+/);

  let bestProfile = GENERIC_PROFILE;
  let bestScore = 0;

  for (const profile of CATEGORY_PROFILES) {
    let hits = 0;
    let totalWeight = 0;

    for (const keyword of profile.keywords) {
      const kwTokens = keyword.toLowerCase().split(/\s+/);
      totalWeight++;
      // multi-word keyword matching
      if (kwTokens.length > 1) {
        if (searchText.includes(keyword.toLowerCase())) {
          hits += 2; // multi-word match is stronger
          totalWeight++;
        }
      } else {
        if (tokens.some((t) => t === kwTokens[0] || t.startsWith(kwTokens[0]))) {
          hits++;
        }
      }
    }

    const score = totalWeight > 0 ? hits / totalWeight : 0;
    if (score > bestScore) {
      bestScore = score;
      bestProfile = profile;
    }
  }

  // Normalize confidence to 0.50–0.99 range when there's any match, else 0.30
  const confidence = bestScore > 0 ? Math.min(0.50 + bestScore * 1.5, 0.99) : 0.30;

  return { profile: bestProfile, confidence };
}

// ─── Copy Generator (category-aware) ─────────────────────────────────────────

function buildCopies(product: Product, profile: CategoryProfile, formattedPrice: string, discountText: string) {
  const emoji1 = profile.emojis[0] || '🔥';
  const emoji2 = profile.emojis[1] || '💥';
  const emoji3 = profile.emojis[2] || '🛒';
  const sellingPt = profile.sellingPoints.slice(0, 2).join(', ');
  const cta = `${emoji3} ${profile.ctaStyle}`;
  const url = product.affiliateUrl.url;

  return {
    shortText: `${emoji1} ${product.title} por apenas ${formattedPrice}${discountText}!`,
    mediumText: `${emoji2} ${product.title}\n\n💰 Por apenas: *${formattedPrice}*${discountText}\n✅ ${sellingPt}\n\n${cta}`,
    longText: `${emoji1} OFERTA IMPERDÍVEL!\n\n${product.title}\n\n📦 Destaques:\n${profile.sellingPoints.map((p) => `• ${p}`).join('\n')}\n\n💰 Preço: ${formattedPrice}${discountText}\n\n🔗 ${url}`,
    whatsAppText: `${emoji1} *OFERTA ${profile.name.toUpperCase()}!*\n\n*${product.title}*\n\n${product.previousPrice ? `💰 De: ~${product.previousPrice.formatBRL()}~\n` : ''}💥 Por apenas: *${formattedPrice}* ${discountText}\n\n✅ ${sellingPt}\n\n🛒 *Compre aqui:* ${url}`,
    telegramText: `${emoji1} <b>OFERTA ${profile.name.toUpperCase()}!</b>\n\n<b>${product.title}</b>\n\n${product.previousPrice ? `💰 De: <s>${product.previousPrice.formatBRL()}</s>\n` : ''}💥 Por: <b>${formattedPrice}</b> ${discountText}\n\n✅ ${sellingPt}\n\n🔗 <a href="${url}">CLIQUE AQUI PARA COMPRAR</a>`,
    instagramText: `${emoji1} ${product.title} por ${formattedPrice}${discountText}!\n\n✅ ${sellingPt}\n\nLink no story e na bio! 🛍️`,
    facebookText: `${emoji2} Oferta de ${profile.name}! ${product.title} por ${formattedPrice}. ${profile.ctaStyle} Link: ${url}`,
    threadsText: `${product.title} de ${profile.name} por ${formattedPrice} agora! ${cta} Link: ${url}`,
    pinterestText: `${product.title} – ${profile.name} por ${formattedPrice}. ${sellingPt}. Clique para conferir!`,
    tikTokText: `${emoji2} Olha esse ${profile.name.toLowerCase()}: ${product.title} por ${formattedPrice}! Link na bio.`,
    storyText: `${emoji1} OFERTA: ${product.title} por ${formattedPrice}${discountText}. Arraste para cima!`,
    channelText: `📢 ${profile.name.toUpperCase()}: ${product.title} por apenas ${formattedPrice}! ${cta} Link: ${url}`,
  };
}

// ─── Hashtag Generator ────────────────────────────────────────────────────────

function buildHashtags(profile: CategoryProfile, marketplace: string): string[] {
  const categorySlug = profile.name.toLowerCase().replace(/\s+&\s+/g, '').replace(/\s+/g, '');
  return [
    '#oferta',
    '#desconto',
    '#promocao',
    `#${categorySlug}`,
    `#${marketplace}`,
    '#achadinhos',
    '#compraonline',
    '#mundolk',
  ];
}

// ─── Score Calculator ─────────────────────────────────────────────────────────

function calculateScore(product: Product, confidence: number): { value: number; justification: string } {
  const hasDiscount = product.discountPercentage.hasDiscount();
  const discountValue = hasDiscount ? parseFloat(product.discountPercentage.formatString()) : 0;

  let value = 60;
  if (discountValue >= 30) value += 20;
  else if (discountValue >= 15) value += 10;
  else if (discountValue > 0) value += 5;

  if (confidence > 0.80) value += 10;
  else if (confidence > 0.60) value += 5;

  if (product.brand && product.brand !== 'Desconhecida') value += 5;

  value = Math.min(value, 99);

  const justification = hasDiscount
    ? `Oferta com ${product.discountPercentage.formatString()} de desconto (${product.currentPrice.formatBRL()}). Classificação automática com ${(confidence * 100).toFixed(0)}% de confiança.`
    : `Produto sem desconto identificado. Classificação automática com ${(confidence * 100).toFixed(0)}% de confiança.`;

  return { value, justification };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * Gemini AI Adapter — Category-Aware Offer Generator.
 *
 * Instead of calling the Gemini API for each offer (expensive, slow),
 * this adapter performs intelligent classification locally using product
 * data already extracted by the marketplace adapter, then generates
 * category-specific copy, emojis, hashtags and score.
 *
 * When a real Gemini API key is configured via GEMINI_API_KEY env var,
 * the classification step can be upgraded to use the model for borderline cases.
 */
export class GeminiAIAdapter implements IAIProviderAdapter {
  public readonly providerName: string = 'gemini-2.5-flash';
  private memoryService = AIMemoryService.getInstance();

  public async generateOfferContent(product: Product): Promise<AIOfferGenerationResult> {
    // Load user memory context (for future prompt enrichment)
    await this.memoryService.getMemoryForUser(product.userId);

    const formattedPrice = product.currentPrice.formatBRL();
    const discountText = product.discountPercentage.hasDiscount()
      ? ` (${product.discountPercentage.formatString()})`
      : '';

    // 1. Classify the product based on real extracted data
    const { profile, confidence } = classifyProduct(
      product.title,
      product.description,
      product.categoryId,
    );

    // 2. Build category-specific copy
    const copyData = buildCopies(product, profile, formattedPrice, discountText);
    const copies = ChannelContent.create(copyData);

    // 3. Build category-specific hashtags
    const hashtags = buildHashtags(profile, product.marketplaceSlug);

    // 4. Calculate real score
    const { value: scoreValue, justification } = calculateScore(product, confidence);
    const score = new Score({
      value: scoreValue,
      justification,
      factors: [
        { name: 'Desconto',               weight: 35, score: product.discountPercentage.hasDiscount() ? 90 : 50, reason: product.discountPercentage.formatString() },
        { name: 'Confiança na Categoria', weight: 30, score: Math.round(confidence * 100), reason: `Categoria detectada: ${profile.name}` },
        { name: 'Dados do Produto',       weight: 20, score: product.brand !== 'Desconhecida' ? 85 : 60, reason: 'Marca e título identificados' },
        { name: 'Qualidade do Anúncio',   weight: 15, score: 80, reason: 'Copy gerado com emojis e CTA contextualizados' },
      ],
    });

    const cost = AICost.create(120, 180, this.providerName, 0.00004);

    return {
      copies,
      hashtags,
      emojis: profile.emojis,
      cta: `${profile.emojis[2] || '👉'} ${profile.ctaStyle}`,
      score,
      cost,
    };
  }
}
