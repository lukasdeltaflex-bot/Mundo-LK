'use client';

import React from 'react';
import { Sparkles, Brain } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';

interface AIEnginePanelProps {
  onGenerateAI: (style: string) => Promise<void>;
  isGenerating?: boolean;
}

const AI_STYLES = [
  { id: 'whatsapp', label: 'WhatsApp Escaneável', desc: 'Mensagem curta com negritos e CTA direto' },
  { id: 'instagram', label: 'Instagram Emocional', desc: 'Gancho envolvente, benefícios e hashtags' },
  { id: 'telegram', label: 'Telegram Promo', desc: 'Texto ultra-curto de disparo de ofertas' },
  { id: 'facebook', label: 'Facebook Review', desc: 'Avaliação explicativa com prova social' },
  { id: 'premium', label: 'Premium & Sofisticado', desc: 'Foco em exclusividade e alta qualidade' },
  { id: 'urgency', label: 'Urgência & Escassez', desc: 'Contagem regressiva visual e gatilho de estoque' },
  { id: 'storytelling', label: 'Storytelling', desc: 'Pequena história conectada ao produto' },
  { id: 'emotional', label: 'Conexão Emocional', desc: 'Conecta com os desejos e rotina do comprador' },
  { id: 'review', label: 'Recomendação Pessoal', desc: 'Avaliação sincera em tom de indicação' },
  { id: 'persuasive', label: 'Padrão Persuasivo', desc: 'Equilibrado com foco no benefício principal' },
];

export const AIEnginePanel: React.FC<AIEnginePanelProps> = ({ onGenerateAI, isGenerating }) => {
  return (
    <div className="rounded-2xl border border-purple-500/30 bg-slate-900/90 p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Brain className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Motor de IA Profissional — 10 Estilos & Prompts por Canal (Release 2.2.8.1)
          </h3>
          <p className="text-[11px] text-slate-400">
            Geração real por IA via Gemini/OpenAI com preservação de URLs curtas e encoding UTF-8 limpo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        {AI_STYLES.map((style) => (
          <div
            key={style.id}
            className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 hover:border-purple-500/50 transition cursor-pointer group"
            onClick={() => onGenerateAI(style.id)}
          >
            <div>
              <span className="text-xs font-bold text-white group-hover:text-purple-400 transition block mb-1">
                {style.label}
              </span>
              <p className="text-[10px] text-slate-400 leading-tight">{style.desc}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGenerating}
              onClick={(e) => {
                e.stopPropagation();
                onGenerateAI(style.id);
              }}
              leftIcon={<Sparkles className="h-3 w-3 text-purple-400" />}
              className="text-[11px] mt-3 border-purple-500/20 text-purple-300 hover:bg-purple-500/10"
            >
              {isGenerating ? 'Gerando...' : 'Gerar IA'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
