'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { Terminal, Copy, Download, Upload, Plus, X, Save, CheckCircle2 } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/core/domain/entities/category.entity';
import { FirestorePromptRepository } from '@/infrastructure/firebase/repositories/firestore-prompt.repository';
import { PromptTemplate } from '@/core/domain/entities/prompt-template.entity';

export default function PromptsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('WhatsApp');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'DEPRECATED'>('ACTIVE');

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
  ]);

  const categories = [
    'TODAS', ...PRODUCT_CATEGORIES, 'WhatsApp', 'Instagram', 'Telegram', 'TikTok', 'Pinterest', 'Facebook', 'Threads', 'Black Friday', 'Natal', 'Liquidação'
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

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !template.trim()) return;

    const newPromptDomain = new PromptTemplate({
      id: `p_${Date.now()}`,
      name,
      version: 'v1.0',
      description,
      objective: description || 'Geração personalizada',
      recommendedModel: 'gemini-2.5-flash',
      language: 'pt-BR',
      systemPrompt: 'Você é um assistente especialista em vendas para afiliados no Mundo LK.',
      userPromptTemplate: template,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const repo = new FirestorePromptRepository();
    await repo.save(newPromptDomain);

    const newPromptUI = {
      id: newPromptDomain.id,
      name,
      version: 'v1.0',
      category,
      model: 'gemini-2.5-flash',
      objective: description || 'Geração personalizada',
      status,
      template,
    };

    setPrompts([newPromptUI, ...prompts]);
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setTemplate('');
    setSuccessMsg('Novo Prompt criado e salvo no Firebase com sucesso!');
    setTimeout(() => setSuccessMsg(null), 3000);
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
          <Button size="sm" variant="primary" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setIsModalOpen(true)}>
            Novo Prompt
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

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
              <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300 border border-slate-800 whitespace-pre-line">
                {p.template}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Criar Novo Prompt */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-slate-900 border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Novo Template de Prompt</CardTitle>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription className="text-xs">Cadastre um novo prompt para personalização no Mundo LK</CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <form onSubmit={handleCreatePrompt} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Nome do Prompt</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Copy WhatsApp Black Friday"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Categoria / Canal</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {categories.filter((c) => c !== 'TODAS').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'DEPRECATED')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="ACTIVE">Ativo</option>
                      <option value="DEPRECATED">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Descrição / Objetivo</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objetivo principal do prompt"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Conteúdo do Prompt</label>
                  <textarea
                    rows={5}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="🔥 OFERTA: {{title}} por apenas {{price}}..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />}>
                    Salvar Prompt no Firebase
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
