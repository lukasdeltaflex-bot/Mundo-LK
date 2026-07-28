import { Campaign } from '../../domain/entities/campaign.entity';
import { AnalyticsEventProps } from '../../domain/entities/analytics-event.entity';
import { CampaignROI } from '../../domain/value-objects/CampaignROI';

export type TimeWindowDays = 7 | 30 | 90;

export interface OpportunityItem {
  id: string;
  type: 'SCALE' | 'PAUSE' | 'REFRESH' | 'NEW_CAMPAIGN';
  title: string;
  reason: string;
  action: string;
  impactScore: number; // 0-100
  metricBadge: string;
}

export interface GrowthAnalysisReport {
  analyzedAt: string;
  timeWindowDays: TimeWindowDays;
  totalCampaignsAnalyzed: number;
  heroOpportunity: OpportunityItem | null;
  opportunities: OpportunityItem[];
  alerts: OpportunityItem[];
  channelRankings: Array<{ source: string; revenue: number; conversionRate: number }>;
  executiveSummary: string;
}

/**
 * GrowthAdvisorService — IA Comercial Avançada (Release 2.2.4)
 *
 * Analisa contexto histórico cruzando campanhas e eventos da camada universal (analytics_events).
 * Responde às perguntas de crescimento comercial: "O que fazer hoje?", "Qual oferta pausar?", "Onde escalar?".
 * Coexiste com CampaignOptimizationService (não o substitui).
 */
export class GrowthAdvisorService {
  private static instance: GrowthAdvisorService;

  private constructor() {}

  public static getInstance(): GrowthAdvisorService {
    if (!GrowthAdvisorService.instance) {
      GrowthAdvisorService.instance = new GrowthAdvisorService();
    }
    return GrowthAdvisorService.instance;
  }

  public analyze(
    campaigns: Campaign[],
    events: AnalyticsEventProps[] = [],
    windowDays: TimeWindowDays = 30
  ): GrowthAnalysisReport {
    const opportunities: OpportunityItem[] = [];
    const alerts: OpportunityItem[] = [];

    const now = new Date();
    const cutoffMs = now.getTime() - windowDays * 24 * 60 * 60 * 1000;

    // Filtra campanhas recentes ou ativas
    const activeCampaigns = campaigns.filter(
      (c) => new Date(c.updatedAt || c.createdAt).getTime() >= cutoffMs
    );

    for (const c of activeCampaigns) {
      const roi = CampaignROI.calculate(c.financial.revenue, c.financial.cost);

      // Oportunidade 1: Alta taxa de conversão com bons cliques
      if (c.metrics.conversionRate >= 5 && c.metrics.clicks >= 20) {
        opportunities.push({
          id: `opp_scale_${c.id}`,
          type: 'SCALE',
          title: `Escalar "${c.name}"`,
          reason: `Taxa de conversão de ${c.metrics.conversionRate.toFixed(1)}% está muito acima da média do segmento.`,
          action: `Criar campanhas semelhantes e ampliar impulsionamento nos canais WhatsApp e Instagram.`,
          impactScore: Math.min(Math.round(c.metrics.conversionRate * 10), 100),
          metricBadge: `Conv. ${c.metrics.conversionRate.toFixed(1)}%`,
        });
      }

      // Oportunidade 2: CTR explosivo
      if (c.metrics.ctr >= 15 && c.metrics.clicks >= 30) {
        opportunities.push({
          id: `opp_viral_${c.id}`,
          type: 'SCALE',
          title: `Potencial Viral em "${c.name}"`,
          reason: `CTR de ${c.metrics.ctr.toFixed(1)}% indica alto interesse no criativo.`,
          action: `Replicar o mesmo formato de copy/imagem para ofertas de produtos similares.`,
          impactScore: Math.min(Math.round(c.metrics.ctr * 5), 95),
          metricBadge: `CTR ${c.metrics.ctr.toFixed(1)}%`,
        });
      }

      // Alerta 1: Oferta sem cliques há mais de 7 dias
      const daysInactive = Math.floor((now.getTime() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (c.status === 'ACTIVE' && c.metrics.clicks === 0 && daysInactive >= 7) {
        alerts.push({
          id: `alt_stale_${c.id}`,
          type: 'REFRESH',
          title: `Oferta Parada: "${c.name}"`,
          reason: `Nenhum clique registrado nos últimos ${daysInactive} dias.`,
          action: `Atualizar imagem do criativo ou republicar em novos grupos de afiliados.`,
          impactScore: 70,
          metricBadge: `${daysInactive}d sem cliques`,
        });
      }

      // Alerta 2: ROI Negativo
      if (c.financial.cost > 0 && roi < 0) {
        alerts.push({
          id: `alt_roi_${c.id}`,
          type: 'PAUSE',
          title: `Pausar Campanha Defasada: "${c.name}"`,
          reason: `ROI de ${roi.toFixed(0)}% com custo de R$ ${c.financial.cost.toFixed(2)}.`,
          action: `Pausar investimento imediatamente e reavaliar margem de comissão.`,
          impactScore: 90,
          metricBadge: `ROI ${roi.toFixed(0)}%`,
        });
      }
    }

    // Ordena oportunidades por Impact Score
    opportunities.sort((a, b) => b.impactScore - a.impactScore);
    alerts.sort((a, b) => b.impactScore - a.impactScore);

    const heroOpportunity = opportunities[0] || null;

    // Rankings de canais com base nos analytics_events
    const channelRankings = this.computeChannelRankings(events);

    const executiveSummary = this.buildExecutiveSummary(
      activeCampaigns.length,
      heroOpportunity,
      alerts.length
    );

    return {
      analyzedAt: now.toISOString(),
      timeWindowDays: windowDays,
      totalCampaignsAnalyzed: activeCampaigns.length,
      heroOpportunity,
      opportunities,
      alerts,
      channelRankings,
      executiveSummary,
    };
  }

  private computeChannelRankings(
    events: AnalyticsEventProps[]
  ): Array<{ source: string; revenue: number; conversionRate: number }> {
    const map = new Map<string, { total: number; conversions: number; revenue: number }>();

    for (const e of events) {
      const src = e.source || 'outros';
      const curr = map.get(src) || { total: 0, conversions: 0, revenue: 0 };
      curr.total += 1;
      if (e.event === 'CONVERSION') {
        curr.conversions += 1;
        curr.revenue += (e.metadata?.revenue as number) || 0;
      }
      map.set(src, curr);
    }

    return Array.from(map.entries())
      .map(([source, data]) => ({
        source,
        revenue: data.revenue,
        conversionRate: data.total > 0 ? (data.conversions / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private buildExecutiveSummary(
    total: number,
    hero: OpportunityItem | null,
    alertsCount: number
  ): string {
    if (total === 0) return 'Nenhuma campanha ativa encontrada na janela selecionada.';

    const parts: string[] = [];
    if (hero) {
      parts.push(`🔥 Principal recomendação do dia: ${hero.title} — ${hero.reason}`);
    } else {
      parts.push('✅ Todas as campanhas ativas estão operando em ritmo constante.');
    }

    if (alertsCount > 0) {
      parts.push(`⚠️ ${alertsCount} alerta${alertsCount > 1 ? 's' : ''} operacional${alertsCount > 1 ? 'is' : ''} requerem atenção.`);
    }

    return parts.join(' ');
  }
}
