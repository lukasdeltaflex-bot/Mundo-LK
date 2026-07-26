'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import { Link as LinkIcon, Copy, ExternalLink, MousePointer, DollarSign, TrendingUp, Plus } from 'lucide-react';

export interface UserLinkItem {
  id: string;
  title: string;
  originalUrl: string;
  affiliateUrl: string;
  marketplace: string;
  category: string;
  createdAt: string;
  publicationCount: number;
  clicks: number;
  conversions: number;
  commissionEstimate: string;
}

export default function LinksPage() {
  const [links] = useState<UserLinkItem[]>([]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <LinkIcon className="h-6 w-6 text-blue-400" />
            <span>Gerenciador Profissional de Links</span>
          </h1>
          <p className="text-sm text-slate-400">Rastreamento de URLs, publicações, cliques e comissões.</p>
        </div>

        <Link href="/dashboard">
          <Button size="sm" variant="primary" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Cadastrar Novo Link
          </Button>
        </Link>
      </div>

      {links.length === 0 ? (
        /* Empty State with 0 Mock Data */
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto mb-4">
            <LinkIcon className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Você ainda não possui links cadastrados.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Importe produtos através do Dashboard para gerar e rastrear seus links de afiliado.
          </p>
          <Link href="/dashboard">
            <Button variant="primary" size="sm" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Importar 1º Produto
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {links.map((l) => (
            <Card key={l.id} className="p-5">
              <CardHeader className="p-0 mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MarketplaceBadge marketplaceSlug={l.marketplace} />
                      <Badge variant="neutral">{l.category}</Badge>
                    </div>
                    <CardTitle className="text-base">{l.title}</CardTitle>
                  </div>
                  <div className="text-xs text-slate-400">Criado em: {l.createdAt}</div>
                </div>
              </CardHeader>

              <CardContent className="p-0 space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Link Afiliado:</span>
                    <span className="text-blue-400 truncate block">{l.affiliateUrl}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Link Original:</span>
                    <span className="text-slate-400 truncate block">{l.originalUrl}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Publicações</span>
                      <span className="font-bold text-white text-xs">{l.publicationCount} vezes</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                    <MousePointer className="h-4 w-4 text-purple-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cliques</span>
                      <span className="font-bold text-white text-xs">{l.clicks}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Conversões</span>
                      <span className="font-bold text-white text-xs">{l.conversions}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Comissão</span>
                      <span className="font-bold text-amber-400 text-xs">{l.commissionEstimate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="secondary" className="text-xs" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={() => navigator.clipboard.writeText(l.affiliateUrl)}>
                    Copiar Link Afiliado
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs" leftIcon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.open(l.originalUrl, '_blank')}>
                    Ver Produto
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
