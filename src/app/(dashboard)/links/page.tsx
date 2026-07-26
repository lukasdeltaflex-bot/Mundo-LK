'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import { Link as LinkIcon, Copy, ExternalLink, MousePointer, DollarSign, TrendingUp } from 'lucide-react';

export default function LinksPage() {
  const [links] = useState([
    {
      id: 'l_1',
      title: 'Smartphone Xiaomi Redmi Note 13 256GB',
      originalUrl: 'https://shopee.com.br/product/123/456',
      affiliateUrl: 'https://shopee.com.br/universal-link/...',
      marketplace: 'Shopee',
      category: 'Celulares',
      createdAt: '26/07/2026',
      publicationCount: 3,
      clicks: 142,
      conversions: 12,
      commissionEstimate: 'R$ 144,00',
    },
    {
      id: 'l_2',
      title: 'Air Fryer Mondo 4L Inox Touch',
      originalUrl: 'https://mercadolivre.com.br/p/MLB123456',
      affiliateUrl: 'https://mercadolivre.com.br/sec/...',
      marketplace: 'Mercado Livre',
      category: 'Cozinha',
      createdAt: '26/07/2026',
      publicationCount: 1,
      clicks: 85,
      conversions: 5,
      commissionEstimate: 'R$ 75,00',
    },
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <LinkIcon className="h-6 w-6 text-blue-400" />
            <span>Gerenciador Profissional de Links & Afiliados</span>
          </h1>
          <p className="text-sm text-slate-400">Rastreamento de URLs, contagem de publicações, cliques e projeção de comissões.</p>
        </div>
      </div>

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

              {/* Performance Metrics */}
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
                    <span className="text-[10px] text-slate-400 block">Cliques Estimados</span>
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
                    <span className="text-[10px] text-slate-400 block">Comissão Estimada</span>
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
    </div>
  );
}
