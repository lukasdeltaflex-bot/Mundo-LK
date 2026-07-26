'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { FolderHeart, Plus, Flame, DollarSign, Gift, Home, Sparkles, Smartphone, Rocket } from 'lucide-react';

export default function ColecoesPage() {
  const [activeCollection, setActiveCollection] = useState<string>('todas');

  const collections = [
    { id: 'dia', name: 'Ofertas do Dia', icon: Flame, color: 'text-orange-400', count: 12 },
    { id: 'comissao', name: 'Alta Comissão', icon: DollarSign, color: 'text-emerald-400', count: 8 },
    { id: 'presentes', name: 'Presentes', icon: Gift, color: 'text-purple-400', count: 6 },
    { id: 'casa', name: 'Casa & Cozinha', icon: Home, color: 'text-blue-400', count: 14 },
    { id: 'beleza', name: 'Beleza & Cuidados', icon: Sparkles, color: 'text-pink-400', count: 5 },
    { id: 'tecnologia', name: 'Tecnologia & Celulares', icon: Smartphone, color: 'text-sky-400', count: 18 },
    { id: 'alta', name: 'Produtos em Alta', icon: Rocket, color: 'text-amber-400', count: 9 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderHeart className="h-6 w-6 text-blue-400" />
            <span>Coleções & Listas Temáticas de Produtos</span>
          </h1>
          <p className="text-sm text-slate-400">Agrupe seus produtos por temas estratégicos de vendas.</p>
        </div>

        <Button size="sm" variant="primary" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
          Nova Coleção Personalizada
        </Button>
      </div>

      {/* Collection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {collections.map((col) => {
          const Icon = col.icon;
          const isSelected = activeCollection === col.id;
          return (
            <Card
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              className={`p-5 cursor-pointer transition ${
                isSelected ? 'border-blue-500 bg-blue-600/10' : 'hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-slate-950 border border-slate-800 ${col.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="info">{col.count} itens</Badge>
              </div>
              <h3 className="text-base font-bold text-white mb-1">{col.name}</h3>
              <p className="text-xs text-slate-400">Ver produtos organizados nesta coleção</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
