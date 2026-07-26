'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Terminal } from 'lucide-react';

export default function PromptsPage() {
  const prompts = [
    {
      id: 'p_1',
      name: 'WhatsApp Copywriter',
      version: 'v1.0',
      model: 'gemini-2.5-flash',
      objective: 'Converter cliques em grupos de ofertas',
      status: 'ACTIVE',
      template: 'Gere um texto chamativo com emojis e negrito (*texto*) para o produto: {{title}}...',
    },
    {
      id: 'p_2',
      name: 'DeepSeek Score Evaluator',
      version: 'v2.1',
      model: 'deepseek-r1',
      objective: 'Calcular nota de 0 a 100 com justificativa de desconto e reputação',
      status: 'ACTIVE',
      template: 'Avalie o apelo da oferta considerando o preço atual {{price}} e desconto {{discount}}...',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Terminal className="h-6 w-6 text-blue-400" />
          <span>Central de Prompts Versionados</span>
        </h1>
        <p className="text-sm text-slate-400">Todos os prompts de IA centralizados e organizados sem código espalhado.</p>
      </div>

      <div className="space-y-4">
        {prompts.map((p) => (
          <Card key={p.id} className="p-5">
            <CardHeader className="p-0 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <Badge variant="info" className="text-[10px]">{p.version}</Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">Modelo Recomendado: {p.model}</CardDescription>
                </div>
                <Badge variant="success">{p.status}</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <p className="text-xs text-slate-400 mb-3"><span className="font-semibold text-slate-300">Objetivo:</span> {p.objective}</p>
              <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300 border border-slate-800">
                {p.template}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
