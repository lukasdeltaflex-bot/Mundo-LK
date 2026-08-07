'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag, Search, Sparkles, Filter, ShieldCheck, Flame, Star,
  Clock, Share2, Layers, Heart, TrendingUp, CheckCircle2
} from 'lucide-react';
import { SmartCategoryBadge } from './components/SmartCategoryBadge';
import { AffiliateMobileShareSheet } from '../operacao/components/AffiliateMobileShareSheet';
import { AffiliateOffer } from '@/core/domain/entities/affiliate-offer.entity';
import { AffiliateLink } from '@/core/domain/value-objects/affiliate-link.vo';
import { Price } from '@/core/domain/value-objects/price.vo';
import { DiscountPercentage } from '@/core/domain/value-objects/discount-percentage.vo';
import { AffiliateLinkResolver } from '@/core/domain/services/AffiliateLinkResolver';
import { SourceOfTruthService } from '@/core/domain/services/SourceOfTruthService';
import { SmartOrganizationResult, AffiliateSmartOrganizer } from '@/core/domain/services/AffiliateSmartOrganizer';
import { Button } from '@/presentation/components/ui/Button';

import { useAuth } from '@/presentation/context/AuthContext';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';

export type DynamicCollectionTab =
  | 'TODAS'
  | 'NOVIDADES'
  | 'ALTA_PRIORIDADE'
  | 'NUNCA_COMPARTILHADAS'
  | 'COMPARTILHADAS_HOJE'
  | 'TENDENCIAS'
  | 'ALTO_DESCONTO'
  | 'ALTO_POTENCIAL'
  | 'FAVORITAS';

export default function OfertasLibraryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DynamicCollectionTab>('TODAS');
  const [quickFilter, setQuickFilter] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfferForMobile, setSelectedOfferForMobile] = useState<AffiliateOffer | null>(null);

  const smartOrganizer = AffiliateSmartOrganizer.getInstance();

  const [offersData, setOffersData] = useState<
    Array<{
      offer: AffiliateOffer;
      organization: SmartOrganizationResult;
    }>
  >([]);

  useEffect(() => {
    async function loadOrganizedOffers() {
      if (!user?.uid) return;
      try {
        const offerRepo = new FirestoreOfferRepository();
        const productRepo = new FirestoreProductRepository();

        const [rawOffers, rawProducts] = await Promise.all([
          offerRepo.findByUserId(user.uid),
          productRepo.findAll(user.uid),
        ]);

        const prodMap = new Map(rawProducts.map((p) => [p.id, p]));

        const linkResolver = AffiliateLinkResolver.getInstance();
        const sourceOfTruth = SourceOfTruthService.getInstance();

        const resultPromises = rawOffers.map(async (rawOff) => {
          const associatedProd = rawOff.productId ? prodMap.get(rawOff.productId) : null;
          const title = associatedProd?.title || 'Oferta sem título';
          const priceVal = associatedProd?.currentPrice?.amount || 0;
          const prevPriceVal = associatedProd?.previousPrice?.amount || undefined;
          const url = associatedProd?.affiliateUrl?.url || associatedProd?.originalUrl || 'https://shopee.com.br';

          const link = linkResolver.resolve({
            originalMarketplaceUrl: url,
            userAffiliateUrl: url,
          });

          const pricing = sourceOfTruth.validatePricing({
            currentPrice: priceVal,
            originalPrice: prevPriceVal,
          });

          const commission = sourceOfTruth.validateCommission({
            value: null,
            percentage: 8,
          });

          const offer = new AffiliateOffer({
            id: rawOff.id,
            userId: user.uid,
            marketplace: (rawOff as any).marketplaceId || associatedProd?.marketplaceSlug || 'shopee',
            marketplaceItemId: `ITEM_${rawOff.id}`,
            originalUrl: url,
            affiliateLink: link,
            productData: {
              title,
              images: { main: associatedProd?.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', gallery: associatedProd?.images || [] },
              category: associatedProd?.categoryId || 'Geral',
              seller: associatedProd?.brand || 'Oficial',
            },
            pricing,
            commission,
            status: 'ACTIVE',
          });

          const org = await smartOrganizer.analyzeAndOrganize({
            title,
            price: priceVal,
            previousPrice: prevPriceVal,
            url,
          });

          return { offer, organization: org };
        });

        const loaded = await Promise.all(resultPromises);
        setOffersData(loaded);
      } catch (err) {
        console.warn('[Ofertas] Erro ao carregar biblioteca do Firestore:', err);
      }
    }

    loadOrganizedOffers();
  }, [user]);

  const handleUpdateOrganization = (offerId: string, updatedOrg: SmartOrganizationResult) => {
    setOffersData((prev) =>
      prev.map((item) => (item.offer.id === offerId ? { ...item, organization: updatedOrg } : item))
    );
  };

  const handleReclassifyWithAI = async (offerId: string) => {
    const target = offersData.find((item) => item.offer.id === offerId);
    if (!target) return;

    const reclassified = await smartOrganizer.reclassifyWithAI({
      title: target.offer.productData.title,
      price: target.offer.pricing.currentPrice,
      previousPrice: target.offer.pricing.originalPrice ?? undefined,
      url: target.offer.affiliateLink.affiliateUrl,
      currentData: target.organization,
    });

    handleUpdateOrganization(offerId, reclassified);
  };

  const filteredOffers = offersData.filter(({ offer, organization }) => {
    const matchesSearch =
      searchQuery === '' ||
      offer.productData.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      organization.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      organization.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'ALTA_PRIORIDADE') return organization.priority === 'ALTA';
    if (activeTab === 'ALTO_POTENCIAL') return organization.potentialLevel === 'ALTO';

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <Tag className="h-6 w-6 text-blue-400" />
            Biblioteca de Ofertas & Inteligência Comercial
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organização automática por IA com controle humano 100% editável e botão de compartilhamento rápido mobile.
          </p>
        </div>

        {/* Busca Instantânea */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, tag ou categoria..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* ─── COLEÇÕES DINÂMICAS (ABAS DE COLEÇÃO) ─────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'TODAS', label: 'Todas as Ofertas', icon: Layers },
          { id: 'NOVIDADES', label: 'Novidades', icon: Sparkles },
          { id: 'ALTA_PRIORIDADE', label: 'Alta Prioridade', icon: Flame },
          { id: 'NUNCA_COMPARTILHADAS', label: 'Nunca Compartilhadas', icon: Clock },
          { id: 'TENDENCIAS', label: 'Tendências', icon: TrendingUp },
          { id: 'ALTO_POTENCIAL', label: 'Alto Potencial', icon: ShieldCheck },
          { id: 'FAVORITAS', label: 'Favoritas', icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DynamicCollectionTab)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                active
                  ? 'bg-blue-600/10 text-blue-400 border-blue-500/30 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── BARRA DE FILTROS RÁPIDOS EM 1 TOQUE ─────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs bg-slate-950 p-2 rounded-2xl border border-slate-800 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-500 uppercase px-2 shrink-0 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filtros Rápidos:
        </span>
        {['TODOS', 'HOJE', 'ESTA_SEMANA', 'NUNCA_COMPARTILHADAS', 'ALTO_DESCONTO', 'IA_RECOMENDA'].map((f) => (
          <button
            key={f}
            onClick={() => setQuickFilter(f)}
            className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 text-[11px] transition ${
              quickFilter === f
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ─── LISTA / GRID DE OFERTAS ORGANIZADAS ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOffers.map(({ offer, organization }) => (
          <div key={offer.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={offer.productData.images.main}
                  alt={offer.productData.title}
                  className="h-16 w-16 rounded-xl object-cover border border-slate-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase">
                    {offer.marketplace}
                  </span>
                  <h3 className="text-xs font-bold text-white line-clamp-2 mt-1">{offer.productData.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-extrabold text-emerald-400">
                      R$ {offer.pricing.currentPrice.toFixed(2)}
                    </span>
                    {offer.pricing.originalPrice && (
                      <span className="text-xs text-slate-500 line-through">
                        R$ {offer.pricing.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Componente de Sugestão da IA (100% Editável + Histórico) */}
              <SmartCategoryBadge
                organization={organization}
                onUpdate={(updated) => handleUpdateOrganization(offer.id, updated)}
                onReclassifyWithAI={() => handleReclassifyWithAI(offer.id)}
              />
            </div>

            {/* Ação Mobile One-Handed Share */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedOfferForMobile(offer)}
              leftIcon={<Share2 className="h-3.5 w-3.5 text-blue-400" />}
              className="w-full border-blue-500/20 text-blue-300 hover:bg-blue-600/10 text-xs py-2 mt-2"
            >
              Compartilhar no Celular
            </Button>
          </div>
        ))}
      </div>

      {/* Modal Mobile Share Sheet */}
      {selectedOfferForMobile && (
        <AffiliateMobileShareSheet
          offer={selectedOfferForMobile}
          isOpen={Boolean(selectedOfferForMobile)}
          onClose={() => setSelectedOfferForMobile(null)}
        />
      )}
    </div>
  );
}
