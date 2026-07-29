'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/presentation/context/AuthContext';
import { FirestoreMarketplaceListingRepository } from '@/infrastructure/firebase/repositories/firestore-marketplace-listing.repository';
import { MarketplaceListingSyncService } from '@/core/application/services/integrations/MarketplaceListingSyncService';
import { MarketplaceListing } from '@/core/domain/entities/marketplace-listing.entity';
import { ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

export function PublishedListingsTable() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadListings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const repo = new FirestoreMarketplaceListingRepository();
      const res = await repo.findPagedByUserId(user.uid, 50);
      setListings(res.items);
    } catch (err) {
      console.warn('[PublishedListingsTable] load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleSyncAll = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await MarketplaceListingSyncService.getInstance().syncUserListings(user.uid);
      await loadListings();
    } catch (err) {
      console.warn('[PublishedListingsTable] sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            Anúncios Publicados nos Marketplaces
            <span className="rounded-full bg-blue-500/20 text-blue-400 text-xs px-2.5 py-0.5 font-mono">
              {listings.length} Registros
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Acompanhamento contínuo de status, ID externo e sincronização dos canais ativos.
          </p>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-all"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin text-blue-400' : ''} />
          {isSyncing ? 'Sincronizando…' : 'Sincronizar Todos'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3">Marketplace</th>
              <th className="p-3">ID Externo</th>
              <th className="p-3">Status</th>
              <th className="p-3">Preço / Estoque</th>
              <th className="p-3">Publicado em</th>
              <th className="p-3">Última Sincronização</th>
              <th className="p-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-slate-800/40 transition">
                <td className="p-3">
                  <span className="font-bold text-white uppercase tracking-wider font-mono">
                    {l.marketplaceSlug}
                  </span>
                </td>
                <td className="p-3 font-mono text-slate-400">
                  {l.externalId || 'Em processamento'}
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    l.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    l.status === 'PUBLISHING' ? 'bg-blue-500/20 text-blue-300 animate-pulse' :
                    l.status === 'EXPIRED_TOKEN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {l.status === 'PUBLISHED' && <CheckCircle2 size={12} />}
                    {l.status === 'EXPIRED_TOKEN' && <ShieldAlert size={12} />}
                    {l.status === 'FAILED' && <AlertTriangle size={12} />}
                    <span>{l.status}</span>
                  </span>
                </td>
                <td className="p-3 font-mono">
                  R$ {l.price.toFixed(2)} | Qtd: {l.stock}
                </td>
                <td className="p-3 text-slate-400">
                  {l.publishedAt ? new Date(l.publishedAt).toLocaleString('pt-BR') : '—'}
                </td>
                <td className="p-3 text-slate-400 font-mono">
                  {l.lastSyncAt ? new Date(l.lastSyncAt).toLocaleTimeString('pt-BR') : 'Pendente'}
                </td>
                <td className="p-3 text-right">
                  {l.listingUrl ? (
                    <a
                      href={l.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30 transition"
                    >
                      <span>Abrir Anúncio</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
            {listings.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  Nenhum anúncio publicado registrado até o momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
