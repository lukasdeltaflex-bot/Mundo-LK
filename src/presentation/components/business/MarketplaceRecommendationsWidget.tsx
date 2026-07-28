'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/presentation/context/AuthContext';
import { OpportunityScoreService } from '@/core/application/services/OpportunityScoreService';
import { MarketplaceRecommendation, RecommendationStatus } from '@/core/domain/entities/marketplace-recommendation.entity';
import { MarketplaceSlug } from '@/core/domain/entities/marketplace-trend.entity';
import { Sparkles, TrendingUp, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';

interface Props {
  onSelectRecommendation?: (rec: MarketplaceRecommendation) => void;
}

export function MarketplaceRecommendationsWidget({ onSelectRecommendation }: Props) {
  const { user } = useAuth();
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceSlug>('shopee');
  const [recommendations, setRecommendations] = useState<MarketplaceRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecommendations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const results = await OpportunityScoreService.getInstance().generateRecommendationsForUser(
        user.uid,
        selectedMarketplace,
        65 // Score mínimo de exibição
      );
      setRecommendations(results);
    } catch (err) {
      console.warn('[MarketplaceRecommendationsWidget] load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedMarketplace]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleExecute = (rec: MarketplaceRecommendation) => {
    rec.status = 'EXECUTED';
    setRecommendations((prev) => prev.map((item) => (item.id === rec.id ? rec : item)));

    if (onSelectRecommendation) {
      onSelectRecommendation(rec);
    } else {
      // Redireciona para o Hub /operacao com os parâmetros preenchidos
      const searchUrl = `/operacao?keyword=${encodeURIComponent(rec.keyword)}&marketplace=${rec.marketplaceSlug}`;
      window.location.href = searchUrl;
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Oportunidades de Mercado Detectadas
            </h3>
            <p className="text-xs text-slate-400">
              Score preditivo (0-100) combinando demanda, concorrência e margem
            </p>
          </div>
        </div>

        {/* Seleção de Marketplace */}
        <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl p-1 border border-slate-700 text-xs">
          {(['shopee', 'mercadolivre'] as MarketplaceSlug[]).map((slug) => (
            <button
              key={slug}
              onClick={() => setSelectedMarketplace(slug)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                selectedMarketplace === slug
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {slug}
            </button>
          ))}
          <button
            onClick={loadRecommendations}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            title="Atualizar Oportunidades"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Lista de Cartões de Recomendação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.slice(0, 4).map((rec) => (
          <div
            key={rec.id}
            className={`rounded-xl p-5 border flex flex-col justify-between gap-4 transition-all ${
              rec.status === 'EXECUTED'
                ? 'bg-slate-800/20 border-slate-800 opacity-60'
                : 'bg-slate-800/50 border-slate-700/60 hover:border-amber-500/40'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-amber-400 font-mono font-semibold uppercase tracking-wider">
                  {rec.productCategory}
                </span>
                <span
                  className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                    rec.opportunityScore >= 85
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  Score: {rec.opportunityScore}/100
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-100">{rec.keyword}</h4>

              <ul className="space-y-1 pt-1">
                {rec.reasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ação Assistida (1-clique) */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-700/40">
              <span className="text-[11px] text-slate-400 font-medium">
                {rec.status === 'EXECUTED' ? 'Oferta Processada' : 'Aprovação Assistida'}
              </span>

              <button
                onClick={() => handleExecute(rec)}
                disabled={rec.status === 'EXECUTED'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rec.status === 'EXECUTED'
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                }`}
              >
                {rec.status === 'EXECUTED' ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Concluído</span>
                  </>
                ) : (
                  <>
                    <span>Gerar Oferta (1-clique)</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {!isLoading && recommendations.length === 0 && (
          <p className="text-xs text-slate-500 col-span-2 text-center py-6">
            Nenhuma nova oportunidade com score alto para {selectedMarketplace.toUpperCase()} no momento.
          </p>
        )}
      </div>
    </div>
  );
}
