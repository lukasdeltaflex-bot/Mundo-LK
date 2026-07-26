'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { Terminal, Copy, Download, Upload, Plus } from 'lucide-react';

export default function PromptsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [prompts, setPrompts] = useState([
    {
      id: 'p_1',
      name: 'WhatsApp Copywriter Pro',
      version: 'v1.0',
      category: 'WhatsApp',
      model: 'gemini-2.5-flash',
      objective: 'Converter cliques em grupos de ofertas com escassez e emojis',
      status: 'ACTIVE',
      template: '🔥 *OFERTA IMPERDÍVEL!*\n\n*{{title}}*\n\n💰 Por apenas: *{{price}}*\n\n🛒 Link: {{url}}',
    },
    {
      id: 'p_2',
      name: 'DeepSeek Score Evaluator',
      version: 'v2.1',
      category: 'Eletrônicos',
      model: 'deepseek-r1',
      objective: 'Calcular nota de 0 a 100 com justificativa de desconto e reputação',
      status: 'ACTIVE',
      template: 'Avalie a atratividade da oferta {{title}} de preço {{price}}.',
    },
    {
      id: 'p_3',
      name: 'Instagram Story Engagement',
      version: 'v1.2',
      category: 'Instagram',
      model: 'claude-3.5-sonnet',
      objective: 'Texto envolvente curto para sticker de link nos stories do Instagram',
      status: 'ACTIVE',
      template: '🔥 Baixou demais! {{title}} por apenas {{price}}! Confira no link do story!',
    },
  ]);

  const categories = [
    'TODAS', 'WhatsApp', 'Instagram', 'Telegram', 'TikTok', 'Pinterest', 'Facebook', 'Threads',
    'Eletrônicos', 'Casa', 'Moda', 'Beleza', 'Esportes', 'Infantil', 'Pet', 'Games', 'Automotivo',
    'Black Friday', 'Natal', 'Liquidação'
  ];

  const handleDuplicate = (id: string) => {
    const p = prompts.find((item) => item.id === id);
    if (p) {
      const dup = {
        ...p,
        id: `p_${Date.now()}`,
        name: `${p.name} (Cópia)`,
        version: 'v1.0',
      };
      setPrompts([dup, ...prompts]);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(prompts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mundo_lk_prompts_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredPrompts = selectedCategory === 'TODAS'
    ? prompts
    : prompts.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="h-6 w-6 text-blue-400" />
            <span>Biblioteca & Prompt Manager</span>
          </h1>
          <p className="text-sm text-slate-400">Gerenciamento, versão, importação e exportação de templates de IA.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={handleExportJSON}>
            Exportar JSON
          </Button>
          <Button size="sm" variant="secondary" className="text-xs" leftIcon={<Upload className="h-3.5 w-3.5" />}>
            Importar
          </Button>
          <Button size="sm" variant="primary" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Novo Prompt
          </Button>
        </div>
      </div>

      {/* Category Filter Pills */}
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

      {/* Prompts List */}
      <div className="space-y-4">
        {filteredPrompts.map((p) => (
          <Card key={p.id} className="p-5">
            <CardHeader className="p-0 mb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <Badge variant="info" className="text-[10px]">{p.version}</Badge>
                    <Badge variant="neutral" className="text-[10px] bg-slate-800 text-slate-300">{p.category}</Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">Modelo Recomendado: {p.model}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-xs" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={() => handleDuplicate(p.id)}>
                    Duplicar
                  </Button>
                  <Badge variant="success">{p.status}</Badge>
                </div>
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
