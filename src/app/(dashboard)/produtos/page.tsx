'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { ExternalLink, Copy, Tag as TagIcon } from 'lucide-react';

export default function ProdutosPage() {
  const [selectedTag, setSelectedTag] = useState<string>('TODAS');

  const smartTags = [
    'TODAS', 'Frete Grátis', 'Cupom', 'Oferta Relâmpago', 'Loja Oficial',
    'Mais Vendido', 'Menor Preço', 'Excelente Avaliação', 'Original', 'Premium'
  ];

  const products = [
    {
      id: 'prod_1',
      title: 'Smartphone Xiaomi Redmi Note 13 256GB 8GB RAM',
      brand: 'Xiaomi',
      store: 'Shopee',
      currentPrice: 'R$ 1.199,00',
      previousPrice: 'R$ 1.899,00',
      discount: '36% OFF',
      tags: ['Frete Grátis', 'Menor Preço', 'Original', 'Premium', 'Loja Oficial'],
      url: 'https://shopee.com.br/product/...',
    },
    {
      id: 'prod_2',
      title: 'Fritadeira Eletrica Air Fryer Mondo 4L Inox 1500W',
      brand: 'Mondo Home',
      store: 'Mercado Livre',
      currentPrice: 'R$ 299,90',
      previousPrice: 'R$ 499,90',
      discount: '40% OFF',
      tags: ['Frete Grátis', 'Oferta Relâmpago', 'Cupom', 'Excelente Avaliação'],
      url: 'https://mercadolivre.com.br/...',
    },
    {
      id: 'prod_3',
      title: 'Fone de Ouvido Bluetooth Sem Fio Noise Cancelling',
      brand: 'AudioTech',
      store: 'Amazon BR',
      currentPrice: 'R$ 349,00',
      previousPrice: 'R$ 599,00',
      discount: '41% OFF',
      tags: ['Frete Grátis', 'Oferta Relâmpago', 'Mais Vendido'],
      url: 'https://amazon.com.br/...',
    },
    {
      id: 'prod_4',
      title: 'Smart TV 55 polegadas 4K UHD Wi-Fi Bluetooth',
      brand: 'Samsung',
      store: 'Magazine Luiza',
      currentPrice: 'R$ 2.499,00',
      previousPrice: 'R$ 3.299,00',
      discount: '24% OFF',
      tags: ['Frete Grátis', 'Premium', 'Original', 'Loja Oficial'],
      url: 'https://magazineluiza.com.br/...',
    },
  ];

  const filteredProducts = selectedTag === 'TODAS'
    ? products
    : products.filter((p) => p.tags.includes(selectedTag));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <TagIcon className="h-6 w-6 text-blue-400" />
          <span>Catálogo Inteligente com Smart Tags</span>
        </h1>
        <p className="text-sm text-slate-400">Produtos categorizados automaticamente por gatilhos de conversão.</p>
      </div>

      {/* Smart Tags Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {smartTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedTag === tag
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.map((p) => (
          <Card key={p.id} className="p-5">
            <CardHeader className="mb-2 p-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="info" className="mb-2">{p.store}</Badge>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">Marca: {p.brand}</CardDescription>
                </div>
                <Badge variant="success">{p.discount}</Badge>
              </div>

              {/* Tags Badges */}
              <div className="flex flex-wrap gap-1 mt-3">
                {p.tags.map((t, idx) => (
                  <span key={idx} className="text-[10px] bg-slate-800 text-blue-300 px-2 py-0.5 rounded border border-slate-700 font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0 pt-3">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-xl font-bold text-emerald-400">{p.currentPrice}</span>
                {p.previousPrice && (
                  <span className="text-xs text-slate-500 line-through">{p.previousPrice}</span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 text-xs"
                  leftIcon={<Copy className="h-3.5 w-3.5" />}
                  onClick={() => navigator.clipboard.writeText(p.url)}
                >
                  Copiar Link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                  onClick={() => window.open(p.url, '_blank')}
                >
                  Abrir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
