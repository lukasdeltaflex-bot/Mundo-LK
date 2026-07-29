'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, Flame, CheckCircle2, Clock, Play, AlertCircle, Plus } from 'lucide-react';
import { AffiliateOffer } from '@/core/domain/entities/affiliate-offer.entity';
import { AffiliateCampaign, CampaignType } from '@/core/domain/entities/affiliate-campaign.entity';
import { DailyAffiliateAssistant, DailyBriefingResult } from '@/core/application/services/DailyAffiliateAssistant';
import { AffiliateCampaignScheduler } from '@/core/domain/services/AffiliateCampaignScheduler';
import { useAuth } from '@/presentation/context/AuthContext';
import { Button } from '@/presentation/components/ui/Button';

interface AffiliateCampaignsManagerProps {
  offers: AffiliateOffer[];
}

export const AffiliateCampaignsManager: React.FC<AffiliateCampaignsManagerProps> = ({ offers }) => {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<DailyBriefingResult | null>(null);
  const [campaigns, setCampaigns] = useState<AffiliateCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const assistant = DailyAffiliateAssistant.getInstance();
  const scheduler = AffiliateCampaignScheduler.getInstance();

  const loadAssistant = async () => {
    setIsLoading(true);
    const activeUid = user?.uid || 'usr_affiliate_01';
    const result = await assistant.generateDailyBriefing(activeUid, offers);
    setBriefing(result);

    const userCampaigns = scheduler.getUserCampaigns(activeUid);
    setCampaigns(userCampaigns);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAssistant();
  }, [offers]);

  const handleApproveDraftCampaign = async (campaign: AffiliateCampaign) => {
    try {
      const targetOffer = offers.find((o) => o.id === campaign.offerId);
      if (!targetOffer) return;

      const scheduledTime = new Date(Date.now() + 30 * 60000).toISOString(); // 30 min no futuro
      await scheduler.schedule(campaign, scheduledTime);
      scheduler.execute(campaign, targetOffer);

      loadAssistant();
    } catch (err: any) {
      alert(`Erro ao aprovar campanha: ${err?.message || String(err)}`);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Gerenciador de Campanhas & Assistente Diário
            </h2>
            <p className="text-[11px] text-slate-400">
              Briefing matinal de oportunidades e agendamento de postagens organizadas.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Assistant Briefing Banner */}
      {briefing && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
            <Sparkles className="h-4 w-4 text-amber-400" /> Briefing Matinal do Assistente IA
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">{briefing.greetingMessage}</p>

          {/* Draft Campaigns to Approve in 1-Click */}
          {briefing.draftCampaignsToApprove.length > 0 && (
            <div className="pt-2 border-t border-blue-500/20 space-y-2">
              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> Campanhas Rascunho de Queda de Preço Prontas para Aprovação
              </div>
              <div className="space-y-2">
                {briefing.draftCampaignsToApprove.map((draft) => (
                  <div key={draft.id} className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white">{draft.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tipo: <span className="text-amber-400 font-bold">{draft.campaignType}</span> • Canais: {draft.channels.join(', ').toUpperCase()}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveDraftCampaign(draft)}
                      leftIcon={<Play className="h-3 w-3" />}
                      className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shrink-0"
                    >
                      Aprovar & Agendar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaigns Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-blue-400" /> Campanhas Recentes & Agendamentos
        </h3>

        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
            Nenhuma campanha agendada no momento. Ações de queda de preço aparecerão no briefing matinal.
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.map((cmp) => (
              <div key={cmp.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-white">{cmp.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Tipo: <span className="text-blue-400 font-bold">{cmp.campaignType}</span> • {cmp.channels.join(', ').toUpperCase()}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                  cmp.status === 'EXECUTED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {cmp.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
