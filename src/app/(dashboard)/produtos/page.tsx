'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { ExternalLink, Copy } from 'lucide-react';

export default function ProdutosPage() {
  const products = [
    {
      id: 'prod_1',
      title: 'Smartphone Xiaomi Redmi Note 13 256GB 8GB RAM',
      brand: 'Xiaomi',
      store: 'Shopee',
      currentPrice: 'R$ 1.199,00',
      previousPrice: 'R$ 1.899,00',
      discount: '36% OFF',
      status: 'ACTIVE',
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
      status: 'ACTIVE',
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
      status: 'ACTIVE',
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
      status: 'ACTIVE',
      url: 'https://magazineluiza.com.br/...',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Catálogo Inteligente de Produtos</h1>
          <p className="text-sm text-slate-400">Produtos cadastrados automaticamente a partir de URLs dos marketplaces.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => (
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
