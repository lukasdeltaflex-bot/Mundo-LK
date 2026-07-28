import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignROI } from '../../domain/value-objects/CampaignROI';

// ── Tipos de saída ────────────────────────────────────────────────────────────

export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CampaignRecommendation {
  campaignId: string;
  campaignName: string;
  priority: RecommendationPriority;
  insight: string;
  action: string;
  metric: string;
}

export interface OptimizationReport {
  generatedAt: string;
  totalCampaigns: number;
  recommendations: CampaignRecommendation[];
  topPerformer: Campaign | null;
  underperformer: Campaign | null;
  summary: string;
}

// ── Thresholds de decisão ────────────────────────────────────────────────────
const THRESHOLDS = {
  highCTR: 15,          // % — CTR acima deste valor indica campanha vencedora
  lowCTR: 3,            // % — CTR abaixo deste valor indica problema
  highConversion: 5,    // % — Taxa de conversão excelente
  lowConversion: 1,     // % — Taxa de conversão crítica
  highROI: 200,         // % — ROI muito positivo
  negativeROI: 0,       // % — ROI negativo → alertar
  highShares: 20,       // compartilhamentos — campanha viral
};

/**
 * CampaignOptimizationService — Etapa 2.1.4 (Release 2.1)
 *
 * Motor de inteligência baseado em regras comerciais para análise de campanhas.
 * Gera recomendações acionáveis sem depender de credenciais de IA externas.
 * Quando disponível, pode invocar uma sugestão via Gemini enriquecida.
 */
export class CampaignOptimizationService {
  private static instance: CampaignOptimizationService;

  private constructor() {}

  public static getInstance(): CampaignOptimizationService {
    if (!CampaignOptimizationService.instance) {
      CampaignOptimizationService.instance = new CampaignOptimizationService();
    }
    return CampaignOptimizationService.instance;
  }

  /**
   * Analisa um conjunto de campanhas e retorna recomendações priorizadas.
   */
  public analyze(campaigns: Campaign[]): OptimizationReport {
    const recommendations: CampaignRecommendation[] = [];

    for (const campaign of campaigns) {
      const recs = this.analyzeOne(campaign);
      recommendations.push(...recs);
    }

    // Ordena: HIGH → MEDIUM → LOW
    recommendations.sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.priority] - order[b.priority];
    });

    const topPerformer = this.findTopPerformer(campaigns);
    const underperformer = this.findUnderperformer(campaigns);
    const summary = this.buildSummary(campaigns, recommendations);

    return {
      generatedAt: new Date().toISOString(),
      totalCampaigns: campaigns.length,
      recommendations,
      topPerformer,
      underperformer,
      summary,
    };
  }

  // ── Análise individual por campanha ─────────────────────────────────────────
  private analyzeOne(c: Campaign): CampaignRecommendation[] {
    const recs: CampaignRecommendation[] = [];
    const roi = CampaignROI.calculate(c.financial.revenue, c.financial.cost);

    // 1. CTR muito alto → escalar
    if (c.metrics.ctr >= THRESHOLDS.highCTR && c.metrics.clicks >= 50) {
      recs.push({
        campaignId: c.id,
        campaignName: c.name,
        priority: 'HIGH',
        insight: `CTR de ${c.metrics.ctr.toFixed(1)}% está acima da média do mercado (${THRESHOLDS.highCTR}%).`,
        action: `Aumentar frequência de postagem no canal ${c.marketplaceSlug.toUpperCase()} e replicar copy para outros marketplaces.`,
        metric: `CTR: ${c.metrics.ctr.toFixed(1)}%`,
      });
    }

    // 2. CTR baixo → revisar copy
    if (c.metrics.clicks >= 30 && c.metrics.ctr < THRESHOLDS.lowCTR) {
      recs.push({
        campaignId: c.id,
        campaignName: c.name,
        priority: 'HIGH',
        insight: `CTR de ${c.metrics.ctr.toFixed(1)}% indica que o criativo não está convertendo visitas em cliques.`,
        action: `Revisar título e imagens da oferta. Testar nova copy com gatilho de urgência ou desconto destacado.`,
        metric: `CTR: ${c.metrics.ctr.toFixed(1)}%`,
      });
    }

    // 3. Alta taxa de conversão → replicar
    if (c.metrics.conversionRate >= THRESHOLDS.highConversion && c.metrics.conversions >= 5) {
      recs.push({
        campaignId: c.id,
        campaignName: c.name,
        priority: 'HIGH',
        insight: `Taxa de conversão de ${c.metrics.conversionRate.toFixed(1)}% é excepcional. Este produto tem alto potencial comercial.`,
        action: `Criar campanhas semelhantes com produtos da mesma categoria. Considerar aumentar o orçamento de impulsionamento.`,
        metric: `Conversão: ${c.metrics.conversionRate.toFixed(1)}%`,
      });
    }

    // 4. Conversão crítica com muitos cliques → funil quebrado
    if (c.metrics.clicks >= 100 && c.metrics.conversionRate < THRESHOLDS.lowConversion) {
      recs.push({
        campaignId: c.id,
        campaignName: c.name,
        priority: 'HIGH',
        insight: `${c.metrics.clicks} cliques mas apenas ${c.metrics.conversionRate.toFixed(2)}% de conversão indica problema na página de destino.`,
        action: `Verificar se o link de afiliado está correto. Revisar preço do produto no marketplace. Confirmar disponibilidade de estoque.`,
        metric: `Cliques: ${c.metrics.clicks} · Conv.: ${c.metrics.conversionRate.toFixed(2)}%`,
      });
    }

    // 5. ROI negativo → atenção urgente
    if (c.financial.cost > 0 && roi < THRESHOLDS.negativeROI) {
      recs.push({
        campaignId: c.id,
        campaignName: c.name,
        priority: 'HIGH',
        insight: `ROI de ${roi.toFixed(0)}% indica que o custo operacional supera a comissão gerada.`,
        action: `Pausar a campanha e reavaliar o custo de impulsionamento. Buscar produto com margem de comissão maior.`,
        metric: `ROI: ${roi.toFixed(0)}%`,
      });
    }

    // 6. ROI muito alto → investir mais
    if (roi >= THRESHOLDS.highROI && c.financial.profit >= 50) {
      recs.push({
        campaignId: c.id,
        campaignName: c.name,
        priority: 'MEDIUM',
        insight: `ROI de ${roi.toFixed(0)}% com lucro de R$ ${c.financial.profit.toFixed(2)}. Campanha lucrativa.`,
        action: `Aumentar investimento nesta campanha. Replicar para canais adicionais (WhatsApp, Telegram, Instagram).`,
        metric: `ROI: ${roi.toFixed(0)}% · Lucro: R$ ${c.financial.profit.toFixed(2)}`,
      });
    }

    // 7. Muitos compartilhamentos → campanha viral
    if (c.metrics.shares >= THRESHOLDS.highShares) {
      recs.push({
        campaignId: c.id,
        campaignName: c.name,
        priority: 'MEDIUM',
        insight: `${c.metrics.shares} compartilhamentos indicam que o conteúdo está sendo organicamente distribuído.`,
        action: `Aproveitar o momento viral criando variações do criativo e incentivando mais compartilhamentos com CTA específico.`,
        metric: `Shares: ${c.metrics.shares}`,
      });
    }

    // 8. Campanha sem nenhum clique ainda
    if (c.metrics.clicks === 0 && c.status === 'ACTIVE') {
      recs.push({
        campaignId: c.id,
        campaignName: c.name,
        priority: 'LOW',
        insight: `Campanha ativa sem cliques registrados. Pode indicar que não foi publicada nos canais de distribuição.`,
        action: `Verificar se o link foi compartilhado nos grupos de WhatsApp, Telegram ou redes sociais. Usar o painel de publicação no Hub.`,
        metric: `Cliques: 0`,
      });
    }

    return recs;
  }

  // ── Utilitários ──────────────────────────────────────────────────────────────
  private findTopPerformer(campaigns: Campaign[]): Campaign | null {
    if (campaigns.length === 0) return null;
    return campaigns.reduce((best, c) =>
      c.metrics.conversionRate > best.metrics.conversionRate ? c : best
    );
  }

  private findUnderperformer(campaigns: Campaign[]): Campaign | null {
    const active = campaigns.filter((c) => c.status === 'ACTIVE' && c.metrics.clicks >= 20);
    if (active.length === 0) return null;
    return active.reduce((worst, c) =>
      c.metrics.ctr < worst.metrics.ctr ? c : worst
    );
  }

  private buildSummary(campaigns: Campaign[], recs: CampaignRecommendation[]): string {
    if (campaigns.length === 0) return 'Nenhuma campanha disponível para análise.';

    const highCount = recs.filter((r) => r.priority === 'HIGH').length;
    const topPerformer = this.findTopPerformer(campaigns);
    const totalRevenue = campaigns.reduce((s, c) => s + c.financial.revenue, 0);
    const avgROI = campaigns.reduce((s, c) => s + CampaignROI.calculate(c.financial.revenue, c.financial.cost), 0) / campaigns.length;

    const parts: string[] = [];

    if (highCount > 0) {
      parts.push(`⚠️ ${highCount} ação${highCount > 1 ? 'ões' : ''} de alta prioridade identificada${highCount > 1 ? 's' : ''}.`);
    } else {
      parts.push('✅ Todas as campanhas estão dentro de parâmetros saudáveis.');
    }

    if (topPerformer && topPerformer.metrics.conversionRate > 0) {
      parts.push(`🏆 Melhor campanha: "${topPerformer.name}" com ${topPerformer.metrics.conversionRate.toFixed(1)}% de conversão.`);
    }

    if (totalRevenue > 0) {
      parts.push(`💰 Receita total acumulada: R$ ${totalRevenue.toFixed(2)} | ROI médio: ${avgROI.toFixed(0)}%.`);
    }

    return parts.join(' ');
  }
}
