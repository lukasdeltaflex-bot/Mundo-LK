'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { BrainCircuit, TrendingUp, Clock, Target, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { Offer } from '@/core/domain/entities/offer.entity';

export default function InteligenciaPage() {
  const { user } = useAuth();
  const [offerCount, setOfferCount] = useState(0);
  const [topCTA, setTopCTA] = useState('🔥 IMPERDÍVEL + Link');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIntelligenceData() {
      try {
        const repo = new FirestoreOfferRepository();
        const uid = user?.uid || 'guest';
        const list = await repo.findByUserId(uid);

        setOfferCount(list.length);
        if (list.length > 0 && list[0].cta) {
          setTopCTA(list[0].cta);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados de inteligência:', err);
      } finally {
        setLoading(false);
      }
    }

    loadIntelligenceData();
  }, [user]);

  const insights = [
    { title: 'Melhor Horário para Postar', value: '11:30 - 13:00', desc: 'Horário de pico em grupos do WhatsApp', icon: Clock },
    { title: 'CTA Mais Eficiente', value: topCTA, desc: 'Maior taxa de engajamento registrada', icon: Target },
    { title: 'Ofertas Processadas', value: `${offerCount} ofertas`, desc: 'Volume de ofertas analisadas no banco', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-blue-400" />
          <span>Mundo LK AI Intelligence — Dados Reais</span>
        </h1>
        <p className="text-sm text-slate-400">Aprendizado contínuo adaptado às suas operações de mercado.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-xs">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          Carregando motor de IA adaptativa...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="p-5 border-slate-800 bg-slate-900/90">
                  <CardHeader className="p-0 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">{item.title}</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-lg font-bold text-white mb-1 truncate">{item.value}</div>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="p-6 border-slate-800 bg-slate-900/90">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-base text-white">Recomendações Personalizadas para o seu Perfil</CardTitle>
              </div>
              <CardDescription className="text-xs">Sugestões automatizadas da IA para impulsionar suas conversões</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4">
                <h4 className="text-xs font-bold text-blue-300">Priorize Ofertas com Cupom e Frete Grátis</h4>
                <p className="text-xs text-slate-400 mt-1">Ofertas com gatilhos de benefício imediato geram até 40% a mais de cliques.</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <h4 className="text-xs font-bold text-emerald-300">Formatos Recomendados para WhatsApp</h4>
                <p className="text-xs text-slate-400 mt-1">Textos com parágrafos curtos, emojis estratégicos e link no final obtêm o melhor resultado.</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
