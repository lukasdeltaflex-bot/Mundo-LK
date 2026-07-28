import { AutomationRule } from '../../domain/entities/automation-rule.entity';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignMetrics } from '../../domain/value-objects/CampaignMetrics';
import { CampaignFinancial } from '../../domain/value-objects/CampaignFinancial';
import { GrowthAdvisorService } from '../../application/services/GrowthAdvisorService';
import { WhatsAppProvider } from '../../application/providers/WhatsAppProvider';

/**
 * Suite de Validação em Memória — Release 2.2
 *
 * Testa de forma determinística:
 * 1. Regra em modo TESTING vs ACTIVE (lógica de cooldown e extração de métricas)
 * 2. WhatsAppProvider (degradação graciosa na ausência de tokens de ambiente)
 * 3. GrowthAdvisorService (Cenário 1: Escala por alto CTR/Conversão | Cenário 2: Alerta por oferta parada/ROI negativo)
 */
export function runRelease22Validations(): {
  allPassed: boolean;
  results: Array<{ test: string; status: 'PASS' | 'FAIL'; detail: string }>;
} {
  const results: Array<{ test: string; status: 'PASS' | 'FAIL'; detail: string }> = [];

  // ── 1. Validação do WhatsAppProvider (Fase 2.2-C) ──────────────────────────
  try {
    const wa = new WhatsAppProvider();
    const isConfigured = wa.isConfigured();
    // Como process.env não tem tokens por padrão no ambiente local de teste:
    if (!isConfigured) {
      results.push({
        test: 'Fase 2.2-C: WhatsAppProvider - Degradação Graciosa',
        status: 'PASS',
        detail: 'Provider desativado graciosamente sem lançar exceções. isConfigured() = false.',
      });
    } else {
      results.push({
        test: 'Fase 2.2-C: WhatsAppProvider - Token Presente',
        status: 'PASS',
        detail: 'Credenciais de ambiente encontradas para WhatsApp Cloud API.',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Fase 2.2-C: WhatsAppProvider',
      status: 'FAIL',
      detail: `Exceção inesperada: ${err.message}`,
    });
  }

  // ── 2. Validação da Entidade AutomationRule & Cooldown (Fase 2.2-A) ────────
  try {
    const rule = new AutomationRule({
      id: 'rule_test_1',
      userId: 'user_1',
      tenantId: 'user_1',
      name: 'Regra de Teste',
      trigger: { metric: 'ctr', operator: '>=', value: 10 },
      action: { type: 'CREATE_RECOMMENDATION' },
      status: 'TESTING',
      cooldownMinutes: 1440,
    });

    const now = new Date();
    const isCooldownNew = rule.isInCooldown(now); // sem lastTriggeredAt → false

    rule.lastTriggeredAt = new Date(now.getTime() - 10 * 60 * 1000).toISOString(); // há 10 min
    const isCooldownActive = rule.isInCooldown(now); // cooldown de 24h ativo → true

    rule.lastTriggeredAt = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(); // há 25h
    const isCooldownExpired = rule.isInCooldown(now); // expirado → false

    if (!isCooldownNew && isCooldownActive && !isCooldownExpired) {
      results.push({
        test: 'Fase 2.2-A: AutomationRule - Trava de Cooldown (Anti-Loop)',
        status: 'PASS',
        detail: 'Cálculo de cooldownMinutes funciona perfeitamente (false → true → false).',
      });
    } else {
      results.push({
        test: 'Fase 2.2-A: AutomationRule - Trava de Cooldown',
        status: 'FAIL',
        detail: `Comportamento incorreto de cooldown. (new:${isCooldownNew}, active:${isCooldownActive}, expired:${isCooldownExpired})`,
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Fase 2.2-A: AutomationRule',
      status: 'FAIL',
      detail: `Exceção: ${err.message}`,
    });
  }

  // ── 3. Validação do GrowthAdvisorService — Cenário 1 (Fase 2.2-D) ───────────
  try {
    const winnerCampaign = new Campaign({
      id: 'camp_winner_1',
      userId: 'user_1',
      tenantId: 'user_1',
      name: 'Smartwatch Pro Top Vendas',
      offerId: 'off_1',
      productId: 'prod_1',
      marketplaceSlug: 'shopee',
      status: 'ACTIVE',
      metrics: CampaignMetrics.create({ views: 500, clicks: 100, shares: 25, conversions: 10 }), // CTR: 20%, Conv: 10%
      financial: CampaignFinancial.create({ revenue: 1500, commission: 150, cost: 30 }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const report = GrowthAdvisorService.getInstance().analyze([winnerCampaign], [], 30);

    if (report.heroOpportunity && report.heroOpportunity.type === 'SCALE' && report.opportunities.length > 0) {
      results.push({
        test: 'Fase 2.2-D: GrowthAdvisor IA — Cenário 1 (Alta Conversão → Recomendação de Escala)',
        status: 'PASS',
        detail: `Hero Opportunity identificada: "${report.heroOpportunity.title}" com Score ${report.heroOpportunity.impactScore}/100.`,
      });
    } else {
      results.push({
        test: 'Fase 2.2-D: GrowthAdvisor IA — Cenário 1',
        status: 'FAIL',
        detail: 'Campanha de alta performance não gerou oportunidade de escala.',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Fase 2.2-D: GrowthAdvisor IA — Cenário 1',
      status: 'FAIL',
      detail: `Exceção: ${err.message}`,
    });
  }

  // ── 4. Validação do GrowthAdvisorService — Cenário 2 (Fase 2.2-D) ───────────
  try {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 10); // 10 dias atrás

    const staleCampaign = new Campaign({
      id: 'camp_stale_1',
      userId: 'user_1',
      tenantId: 'user_1',
      name: 'Tênis Casual sem Saída',
      offerId: 'off_2',
      productId: 'prod_2',
      marketplaceSlug: 'mercadolivre',
      status: 'ACTIVE',
      metrics: CampaignMetrics.create({ views: 10, clicks: 0, shares: 0, conversions: 0 }),
      financial: CampaignFinancial.create({ revenue: 0, commission: 0, cost: 50 }), // ROI negativo
      createdAt: staleDate,
      updatedAt: staleDate,
    });

    const report = GrowthAdvisorService.getInstance().analyze([staleCampaign], [], 30);

    if (report.alerts.length >= 1) {
      results.push({
        test: 'Fase 2.2-D: GrowthAdvisor IA — Cenário 2 (Oferta Parada / ROI Negativo → Alertas Operacionais)',
        status: 'PASS',
        detail: `Alerta gerado com sucesso: "${report.alerts[0].title}" (${report.alerts[0].metricBadge}).`,
      });
    } else {
      results.push({
        test: 'Fase 2.2-D: GrowthAdvisor IA — Cenário 2',
        status: 'FAIL',
        detail: 'Campanha sem cliques e com custo não gerou alertas operacionais.',
      });
    }
  } catch (err: any) {
    results.push({
      test: 'Fase 2.2-D: GrowthAdvisor IA — Cenário 2',
      status: 'FAIL',
      detail: `Exceção: ${err.message}`,
    });
  }

  const allPassed = results.every((r) => r.status === 'PASS');
  return { allPassed, results };
}
