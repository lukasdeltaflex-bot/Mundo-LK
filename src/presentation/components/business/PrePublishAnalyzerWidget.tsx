import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export interface PrePublishAnalyzerWidgetProps {
  score: number;
  productTitle: string;
  category: string;
}

export const PrePublishAnalyzerWidget: React.FC<PrePublishAnalyzerWidgetProps> = ({
  score,
  category,
}) => {
  let bestTime = '20:00 - 22:00 (Horário de Pico)';
  if (category === 'Eletrônicos' || category === 'Games') {
    bestTime = '19:00 - 23:00 (Período Noturno)';
  } else if (category === 'Casa e Decoração' || category === 'Cozinha') {
    bestTime = '11:30 - 14:00 (Intervalo de Almoço)';
  }

  return (
    <div className="rounded-xl border border-blue-500/30 bg-slate-950 p-4 space-y-3 text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span className="font-bold text-white">Análise Pré-Publicação IA</span>
        </div>
        <div className="flex items-center gap-1 bg-blue-600/20 px-2.5 py-1 rounded-full border border-blue-500/40 text-blue-300 font-mono font-bold">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Potencial: {score}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-300">
          <span className="font-semibold flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Pontos Positivos
          </span>
          <ul className="list-disc list-inside text-[10px] space-y-0.5 text-slate-300">
            <li>Preço competitivo auditado</li>
            <li>Demanda alta na categoria {category}</li>
            <li>Excelente margem de desconto</li>
          </ul>
        </div>

        <div className="space-y-1 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-amber-300">
          <span className="font-semibold flex items-center gap-1 text-[11px]">
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" /> Pontos de Atenção
          </span>
          <ul className="list-disc list-inside text-[10px] space-y-0.5 text-slate-300">
            <li>Concorrência ativa em grupos</li>
            <li>Recomendado usar CTA urgente</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
        <span className="flex items-center gap-1 text-blue-400 font-medium">
          <Clock className="h-3.5 w-3.5" /> Sugestão de Horário: <strong className="text-white">{bestTime}</strong>
        </span>
      </div>
    </div>
  );
};
