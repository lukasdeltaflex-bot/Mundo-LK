'use client';

import React, { useState } from 'react';
import { Share2, Sparkles, History, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AffiliateOffer } from '@/core/domain/entities/affiliate-offer.entity';
import { AffiliateShareModal } from '@/presentation/components/business/AffiliateShareModal';
import { AIService } from '../services/AIService';
import { Button } from '@/presentation/components/ui/Button';

interface AffiliateDistributionHubProps {
  offers: AffiliateOffer[];
  onRefreshOffers?: () => void;
}

export const AffiliateDistributionHub: React.FC<AffiliateDistributionHubProps> = ({ offers }) => {
  const [selectedOffer, setSelectedOffer] = useState<AffiliateOffer | null>(null);

  const handleGenerateCopy = (offer: AffiliateOffer) => {
    try {
      AIService.generateAffiliateOfferContent(offer);
      setSelectedOffer(offer);
    } catch (err: any) {
      alert(`Erro na geração de copy: ${err?.message || String(err)}`);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Share2 className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Central de Distribuição & Ofertas para Afiliados
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {offers.length} Ofertas Ativas
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Disparo em 1-clique para WhatsApp, Telegram e redes sociais com link imutável protegido.
            </p>
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
          Nenhuma oferta cadastrada. Cole uma URL da Shopee ou Mercado Livre para começar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <img src={offer.productData.images.main} alt={offer.productData.title} className="h-14 w-14 rounded-lg object-cover border border-slate-800 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[8px] font-bold text-emerald-300 uppercase">
                        {offer.marketplace}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-400">
                        <CheckCircle2 className="h-2.5 w-2.5" /> {offer.pricing.sourceStatus}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-2">{offer.productData.title}</h4>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                  <span className="text-sm font-extrabold text-emerald-400">R$ {offer.pricing.currentPrice.toFixed(2)}</span>
                  <a
                    href={offer.affiliateLink.affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                  >
                    Link Seguro <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateCopy(offer)}
                  leftIcon={<Sparkles className="h-3 w-3 text-amber-400" />}
                  className="text-[11px] border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  Gerar Copy
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedOffer(offer)}
                  leftIcon={<Share2 className="h-3 w-3" />}
                  className="text-[11px] bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                >
                  Compartilhar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {selectedOffer && (
        <AffiliateShareModal offer={selectedOffer} onClose={() => setSelectedOffer(null)} />
      )}
    </div>
  );
};
