'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { ExternalLink, Copy, Tag as TagIcon, ShoppingBag, Plus, Sparkles, Layers } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/core/domain/entities/category.entity';
import { useProducts } from '@/presentation/hooks/useProducts';

export default function ProdutosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const { data: userProducts, isLoading } = useProducts();

  const categories = ['TODAS', ...PRODUCT_CATEGORIES];

  const productsList = userProducts || [];

  const filteredProducts = selectedCategory === 'TODAS'
    ? productsList
    : productsList.filter((p) => p.brand === selectedCategory || p.title.includes(selectedCategory));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-blue-400" />
            <span>Catálogo Inteligente de Produtos</span>
          </h1>
          <p className="text-sm text-slate-400">Produtos cadastrados automaticamente a partir de URLs dos marketplaces.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button size="sm" variant="primary" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Adicionar Produto por URL
            </Button>
          </Link>
          <Link href="/lote">
            <Button size="sm" variant="secondary" className="text-xs" leftIcon={<Layers className="h-3.5 w-3.5" />}>
              Importar em Lote
            </Button>
          </Link>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Carregando seu catálogo...</div>
      ) : filteredProducts.length === 0 ? (
        /* Clean Empty State */
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Você ainda não possui produtos cadastrados.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Cole a URL de qualquer produto da Shopee, Mercado Livre, Amazon ou Magalu no Dashboard para cadastrá-lo automaticamente no seu catálogo.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="text-xs" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                Importar 1º Produto Agora
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="p-5">
              <CardHeader className="mb-2 p-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="info" className="mb-2">{p.marketplaceSlug}</Badge>
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">Marca: {p.brand}</CardDescription>
                  </div>
                  <Badge variant="success">{p.discountPercentage}</Badge>
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
                    onClick={() => navigator.clipboard.writeText(p.affiliateUrl)}
                  >
                    Copiar Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                    onClick={() => window.open(p.affiliateUrl, '_blank')}
                  >
                    Abrir
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
