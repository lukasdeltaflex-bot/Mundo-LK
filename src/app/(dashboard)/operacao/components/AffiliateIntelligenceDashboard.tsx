'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Flame, TrendingDown, Share2, Award, AlertCircle, RefreshCw } from 'lucide-react';
import { AffiliateOffer } from '@/core/domain/entities/affiliate-offer.entity';
import { AffiliateAnalyticsService, AffiliateMetricsResult } from '@/core/application/services/AffiliateAnalyticsService';
import { AffiliateOpportunityScore, OpportunityScoreResult } from '@/core/domain/services/AffiliateOpportunityScore';
import { OfferMonitorService, OpportunityAlert } from '@/core/domain/services/OfferMonitorService';
import { Button } from '@/presentation/components/ui/Button';

interface AffiliateIntelligenceDashboardProps {
  offers: AffiliateOffer[];
}

export const AffiliateIntelligenceDashboard: React.FC<AffiliateIntelligenceDashboardProps> = ({ offers }) => {
  const [metrics, setMetrics] = useState<AffiliateMetricsResult | null>(null);
  const [alerts, setAlerts] = useState<OpportunityAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const analyticsService = AffiliateAnalyticsService.getInstance();
  const monitorService = OfferMonitorService.getInstance();

  const loadDashboard = async () => {
    setIsMonitoring(true);
    const calculatedMetrics = analyticsService.calculateMetrics(offers);
    setMetrics(calculatedMetrics);

    const detectedAlerts: OpportunityAlert[] = [];
    for (const offer of offers) {
      const res = await monitorService.monitorOffer(offer);
      if (res.opportunityAlert) {
        detectedAlerts.push(res.opportunityAlert);
      }
    }
    setAlerts(detectedAlerts);
    setIsMonitoring(false);
  };

  useEffect(() => {
    loadDashboard();
  }, [offers]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Brain className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Affiliate Intelligence Engine
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                Copiloto de Vendas
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Ranking transparente de oportunidades, monitoramento de preços e métricas operacionais confirmadas.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadDashboard}
          disabled={isMonitoring}
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isMonitoring ? 'animate-spin' : ''}`} />}
          className="text-xs border-amber-500/20 text-amber-300 hover:bg-amber-500/10 shrink-0"
        >
          {isMonitoring ? 'Monitorando...' : 'Re-analisar Ofertas'}
        </Button>
      </div>

      {/* Operational Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="text-[10px] font-medium text-slate-400">Ofertas Ativas</div>
            <div className="text-lg font-extrabold text-white">{metrics.activeOffersCount}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="text-[10px] font-medium text-slate-400">Oportunidades Altas</div>
            <div className="text-lg font-extrabold text-amber-400">{metrics.highOpportunityOffersCount}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="text-[10px] font-medium text-slate-400">Copies Geradas</div>
            <div className="text-lg font-extrabold text-emerald-400">{metrics.contentVariationsCount}</div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="text-[10px] font-medium text-slate-400">Disparos Sociais</div>
            <div className="text-lg font-extrabold text-blue-400">{metrics.sharesByChannel.totalShares}</div>
          </div>
        </div>
      )}

      {/* Price Drop Alerts Banner */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <Flame className="h-4 w-4" /> Alertas de Oportunidade Detectados ({alerts.length})
          </div>
          <div className="space-y-1.5">
            {alerts.map((al, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded-lg border border-amber-500/20">
                <span className="text-slate-200 font-medium truncate">{al.alertMessage}</span>
                <span className="text-[10px] font-mono text-emerald-400 shrink-0 font-bold ml-2">
                  -{al.priceDropPercentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunity Ranking */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-amber-400" /> Ranking Transparente de Oportunidades (Score 0-100)
        </h3>

        <div className="space-y-2">
          {offers.map((offer) => {
            const scoreRes = AffiliateOpportunityScore.calculate(offer);

            let scoreBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            if (scoreRes.tier === 'MEDIUM') scoreBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            if (scoreRes.tier === 'LOW') scoreBadge = 'bg-slate-800 text-slate-400 border-slate-700';

            return (
              <div key={offer.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={offer.productData.images.main} alt={offer.productData.title} className="h-10 w-10 rounded-lg object-cover border border-slate-800 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{offer.productData.title}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>R$ {offer.pricing.currentPrice.toFixed(2)}</span>
                      <span>•</span>
                      <span className="capitalize">{offer.marketplace}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Opportunity Score</div>
                    <div className="text-xs font-extrabold text-amber-400">{scoreRes.totalScore} / 100</div>
                  </div>

                  <span className={`rounded-xl px-2.5 py-1 text-xs font-bold border ${scoreBadge}`}>
                    {scoreRes.tier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
