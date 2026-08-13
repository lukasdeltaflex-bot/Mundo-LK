'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { X, Tag, Sparkles, MessageSquare, Flame, Check } from 'lucide-react';
import { Offer } from '@/core/domain/entities/offer.entity';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { UpdateOfferUseCase } from '@/core/application/use-cases/offers/UpdateOfferUseCase';
import { ScoreType } from '@/core/domain/value-objects/score-level.vo';
import { useAuth } from '@/presentation/context/AuthContext';

interface EditOfferModalProps {
  offer: Offer | null;
  productTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MARKETPLACE_OPTIONS = [
  { slug: 'shopee', name: 'Shopee' },
  { slug: 'magalu', name: 'Magazine Luiza (Magalu)' },
  { slug: 'mercadolivre', name: 'Mercado Livre' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'shein', name: 'SHEIN' },
  { slug: 'geral', name: 'Geral / Outro' },
];

export function EditOfferModal({
  offer,
  productTitle,
  isOpen,
  onClose,
  onSuccess,
}: EditOfferModalProps) {
  const { user } = useAuth();
  const [marketplaceSlug, setMarketplaceSlug] = useState('shopee');
  const [marketplaceName, setMarketplaceName] = useState('');
  const [whatsAppCopy, setWhatsAppCopy] = useState('');
  const [scoreValue, setScoreValue] = useState('90');
  const [scoreLabel, setScoreLabel] = useState<ScoreType>('EXCELLENT');
  const [scoreJustification, setScoreJustification] = useState('');
  const [cta, setCta] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (offer) {
      const slug = offer.marketplaceId || (offer as any).marketplace || 'shopee';
      setMarketplaceSlug(slug);
      setMarketplaceName(offer.marketplaceName || MARKETPLACE_OPTIONS.find(m => m.slug === slug)?.name || 'Shopee');
      const existingText = offer.copies?.copies?.whatsAppText ||
        offer.copies?.copies?.shortText ||
        (typeof offer.copies === 'string' ? offer.copies : '');
      setWhatsAppCopy(existingText);
      setScoreValue(offer.scoreValue !== undefined ? String(offer.scoreValue) : '90');
      setScoreLabel(offer.scoreLabel || 'EXCELLENT');
      setScoreJustification(offer.scoreJustification || '');
      setCta(offer.cta || '🔥 Garanta o seu antes que acabe!');
      setHashtags(offer.hashtags ? offer.hashtags.join(', ') : '');
    }
  }, [offer, isOpen]);

  if (!isOpen || !offer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || processing) return;

    const trimmedCopy = whatsAppCopy.trim();
    if (!trimmedCopy) {
      alert('O texto/copy da oferta é obrigatório.');
      return;
    }

    const scoreNum = parseInt(scoreValue, 10);
    const selectedMarketplaceObj = MARKETPLACE_OPTIONS.find(m => m.slug === marketplaceSlug);
    const finalMarketplaceName = selectedMarketplaceObj ? selectedMarketplaceObj.name : marketplaceName.trim();

    setProcessing(true);
    try {
      const repo = new FirestoreOfferRepository();
      const useCase = new UpdateOfferUseCase(repo);

      // Verificação de duplicidade se o marketplace mudou
      if (offer.productId && marketplaceSlug !== (offer.marketplaceId || (offer as any).marketplace)) {
        const existingOffers = await repo.findByProductId(offer.productId, user.uid);
        const duplicate = existingOffers.find(o => (o.marketplaceId || (o as any).marketplace) === marketplaceSlug && o.id !== offer.id);
        if (duplicate) {
          alert(`Este produto já possui uma oferta cadastrada no marketplace ${finalMarketplaceName}. A alteração foi cancelada para evitar duplicidade.`);
          setProcessing(false);
          return;
        }
      }

      const hashtagList = hashtags
        .split(',')
        .map((h) => h.trim().replace(/^#/, ''))
        .filter(Boolean);

      const existingCopies = offer.copies?.copies || {};

      const changes: Partial<Offer> = {
        marketplaceId: marketplaceSlug,
        marketplaceName: finalMarketplaceName,
        scoreValue: !isNaN(scoreNum) ? scoreNum : offer.scoreValue,
        scoreLabel,
        scoreJustification: scoreJustification.trim(),
        cta: cta.trim(),
        hashtags: hashtagList,
        copies: {
          ...offer.copies,
          copies: {
            ...existingCopies,
            whatsAppText: trimmedCopy,
          },
        } as any,
      };

      await useCase.execute({
        offerId: offer.id,
        userId: user.uid,
        changes,
      });

      console.log('[EditOfferModal] Oferta atualizada com sucesso. OfferID:', offer.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[EditOfferModal] Erro ao atualizar oferta:', err);
      const errMsg = err?.message || String(err);
      alert(`Não foi possível salvar as alterações da oferta: ${errMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100">Editar Oferta Comercial</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Identity & Product Link Subheader */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            ID da Oferta: <strong className="font-mono text-amber-400">{offer.id}</strong>
          </span>
          {offer.productId && (
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
              Produto Vinculado: <strong className="font-mono text-blue-400">{offer.productId}</strong>
            </span>
          )}
        </div>

        {productTitle && (
          <div className="px-6 py-2 bg-blue-950/20 border-b border-blue-500/20 text-xs text-blue-300 truncate">
            📌 <strong>{productTitle}</strong>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Marketplace Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Marketplace Canal / Origem Comercial
            </label>
            <select
              value={marketplaceSlug}
              onChange={(e) => {
                const slug = e.target.value;
                setMarketplaceSlug(slug);
                const opt = MARKETPLACE_OPTIONS.find((m) => m.slug === slug);
                if (opt) setMarketplaceName(opt.name);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
            >
              {MARKETPLACE_OPTIONS.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Copy Texto de Envio (WhatsApp / Redes) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-amber-400" /> Texto Criativo / Copy de Divulgação <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={whatsAppCopy}
              onChange={(e) => setWhatsAppCopy(e.target.value)}
              placeholder="Digite ou edite o texto promocional da oferta..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition font-mono leading-relaxed"
            />
          </div>

          {/* Grid de Score & Classificação */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-500" /> Score de Atratividade (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={scoreValue}
                onChange={(e) => setScoreValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Classificação da Oferta
              </label>
              <select
                value={scoreLabel}
                onChange={(e) => setScoreLabel(e.target.value as ScoreType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
              >
                <option value="EXCELLENT">EXCELLENT (Excelente)</option>
                <option value="GOOD">GOOD (Boa)</option>
                <option value="AVERAGE">AVERAGE (Média)</option>
                <option value="POOR">POOR (Baixa)</option>
              </select>
            </div>
          </div>

          {/* Justificativa do Score */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Justificativa Comercial
            </label>
            <input
              type="text"
              value={scoreJustification}
              onChange={(e) => setScoreJustification(e.target.value)}
              placeholder="Ex: Preço 25% abaixo da média de mercado com frete grátis."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* CTA & Hashtags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Chamada para Ação (CTA)
              </label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Ex: 🔥 Garanta o seu antes que acabe!"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hashtags (Separadas por vírgula)
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="promo, achadinhos, desconto"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={processing}
            >
              {processing ? 'Salvando Alterações...' : 'Salvar Oferta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
