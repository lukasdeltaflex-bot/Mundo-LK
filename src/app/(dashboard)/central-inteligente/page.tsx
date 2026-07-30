'use client';

import React from 'react';
import Link from 'next/link';
import {
  Brain, PlugZap, BarChart3, Flame, Activity, ArrowRight, ShieldCheck,
  Zap, Cpu, Lock, Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';

export default function CentralInteligentePage() {
  const modules = [
    {
      id: 'marketplaces',
      title: 'Central de Marketplaces',
      href: '/operacao',
      icon: PlugZap,
      color: 'text-amber-400',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      status: '🟢 Conectado',
      description: 'Gerencie conexões oficiais, sincronizações e integrações de produtos via API com o Mercado Livre e a Shopee.',
      features: ['Autenticação OAuth 2.0', 'Assinatura HMAC-SHA256', 'Gateway Oficial de APIs'],
    },
    {
      id: 'commercial_ai',
      title: 'Inteligência Comercial',
      href: '/analytics',
      icon: BarChart3,
      color: 'text-blue-400',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      status: '🟢 Operacional',
      description: 'Geração automatizada de copies persuasivas via IA Real (Google Gemini 2.5 Flash), classificação inteligente e análises comerciais.',
      features: ['Gemini 2.5 Flash API', 'Gatilhos de Conversão', 'Classificação de Ofertas'],
    },
    {
      id: 'growth_ai',
      title: 'Inteligência de Crescimento',
      href: '/growth',
      icon: Flame,
      color: 'text-purple-400',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      status: '🟢 Estratégico',
      description: 'Análises avançadas de métricas, tendências de vendas de alta margem e recomendações estratégicas para escalar resultados.',
      features: ['Métricas de Conversão', 'Previsão de Tendências', 'Recomendações IA'],
    },
    {
      id: 'diagnostics',
      title: 'Central de Diagnóstico',
      href: '/diagnostico',
      icon: Activity,
      color: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      status: '🟢 Monitoramento Ativo',
      description: 'Monitoramento preventivo e contínuo da infraestrutura, Firebase Auth, Firestore, APIs de Marketplaces e integridade do sistema.',
      features: ['AutoCheck Silencioso', 'Auto-Repair em 1 Toque', 'Relatórios Sanitizados'],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-extrabold uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" /> Hub de Módulos Avançados
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
          <Brain className="h-7 w-7 text-purple-400" />
          Central Inteligente
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-3xl">
          Hub administrativo unificado para gestão de integrações, inteligência comercial, recomendações de crescimento e diagnóstico preventivo.
        </p>
      </div>

      {/* Grid dos Módulos Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map((mod) => {
          const IconComponent = mod.icon;
          return (
            <Card
              key={mod.id}
              className="p-6 bg-slate-900/90 border-slate-800 hover:border-slate-700 transition shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <IconComponent className={`h-6 w-6 ${mod.color}`} />
                    </div>
                    <CardTitle className="text-base text-white font-extrabold">{mod.title}</CardTitle>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${mod.badgeColor}`}>
                    {mod.status}
                  </span>
                </div>

                <CardDescription className="text-xs text-slate-300 leading-relaxed mb-4">
                  {mod.description}
                </CardDescription>

                <div className="flex items-center gap-2 flex-wrap mb-6">
                  {mod.features.map((feat) => (
                    <span key={feat} className="bg-slate-950 border border-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-md font-medium">
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>

              <Link href={mod.href}>
                <Button
                  type="button"
                  className="w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2"
                >
                  Abrir Módulo <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Seção de Expansões Futuras */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-400" />
          <h3 className="text-sm font-extrabold text-white">Próximas Expansões do Hub (Roadmap Técnico)</h3>
        </div>
        <p className="text-xs text-slate-400">
          A Central Inteligente foi projetada de forma escalável para receber módulos de Automação Avançada, Auditoria de Logs e Machine Learning.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {['Automações de Postagem', 'Machine Learning ML', 'Auditoria de Logs', 'Analytics de Canais'].map((item) => (
            <div key={item} className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/50 text-xs text-slate-400 flex items-center justify-between">
              <span>{item}</span>
              <Lock className="h-3.5 w-3.5 text-slate-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
