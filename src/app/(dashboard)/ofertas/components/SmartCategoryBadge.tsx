'use client';

import React, { useState } from 'react';
import { Sparkles, ShieldCheck, RefreshCw, History, Edit3, Check, RotateCcw } from 'lucide-react';
import { SmartOrganizationResult, AIConfidenceLevel } from '@/core/domain/services/AffiliateSmartOrganizer';
import { Button } from '@/presentation/components/ui/Button';

interface SmartCategoryBadgeProps {
  organization: SmartOrganizationResult;
  onUpdate: (updated: SmartOrganizationResult) => void;
  onReclassifyWithAI?: () => Promise<void>;
}

export const SmartCategoryBadge: React.FC<SmartCategoryBadgeProps> = ({
  organization,
  onUpdate,
  onReclassifyWithAI,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isReclassifying, setIsReclassifying] = useState(false);

  const [categoryDraft, setCategoryDraft] = useState(organization.category);
  const [subcategoryDraft, setSubcategoryDraft] = useState(organization.subcategory);
  const [priorityDraft, setPriorityDraft] = useState(organization.priority);

  const getConfidenceBadge = (level: AIConfidenceLevel) => {
    switch (level) {
      case 'ALTA_CONFIANCA':
        return <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">🟢 Alta Confiança ({organization.confidenceScore}%)</span>;
      case 'MEDIA_CONFIANCA':
        return <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">🟡 Média Confiança ({organization.confidenceScore}%)</span>;
      case 'BAIXA_CONFIANCA':
      default:
        return <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">🔴 Revisão Recomendada ({organization.confidenceScore}%)</span>;
    }
  };

  const handleSaveManualEdit = () => {
    const nextVersionNumber = (organization.versionHistory?.length || 0) + 1;
    const updated: SmartOrganizationResult = {
      ...organization,
      category: categoryDraft,
      subcategory: subcategoryDraft,
      priority: priorityDraft,
      isUserValidated: true, // 🔒 TRAVA HUMANA INEGOCIÁVEL
      versionHistory: [
        {
          version: nextVersionNumber,
          timestamp: new Date().toISOString(),
          author: 'USUARIO',
          category: categoryDraft,
          subcategory: subcategoryDraft,
          priority: priorityDraft,
          tags: organization.tags,
          notes: 'Alteração manual salva pelo afiliado',
        },
        ...(organization.versionHistory || []),
      ],
    };

    onUpdate(updated);
    setIsEditing(false);
  };

  const handleRestoreVersion = (versionEntry: any) => {
    const updated: SmartOrganizationResult = {
      ...organization,
      category: versionEntry.category,
      subcategory: versionEntry.subcategory,
      priority: versionEntry.priority,
      isUserValidated: true,
      versionHistory: [
        {
          version: (organization.versionHistory?.length || 0) + 1,
          timestamp: new Date().toISOString(),
          author: 'USUARIO',
          category: versionEntry.category,
          subcategory: versionEntry.subcategory,
          priority: versionEntry.priority,
          tags: organization.tags,
          notes: `Restaurado a partir da Versão #${versionEntry.version}`,
        },
        ...(organization.versionHistory || []),
      ],
    };
    onUpdate(updated);
    setShowHistory(false);
  };

  const handleTriggerReclassify = async () => {
    if (!onReclassifyWithAI) return;
    setIsReclassifying(true);
    try {
      await onReclassifyWithAI();
    } finally {
      setIsReclassifying(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {organization.isUserValidated ? (
            <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-extrabold text-blue-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> 🔒 Validado pelo Afiliado
            </span>
          ) : (
            <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-extrabold text-purple-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Sugestão da IA
            </span>
          )}

          {!organization.isUserValidated && getConfidenceBadge(organization.confidenceLevel)}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            leftIcon={<Edit3 className="h-3 w-3 text-slate-300" />}
            className="text-[11px] py-1 border-slate-800 text-slate-300 hover:bg-slate-900"
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>

          {onReclassifyWithAI && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTriggerReclassify}
              disabled={isReclassifying}
              leftIcon={<RefreshCw className={`h-3 w-3 text-purple-400 ${isReclassifying ? 'animate-spin' : ''}`} />}
              className="text-[11px] py-1 border-purple-500/20 text-purple-300 hover:bg-purple-500/10"
            >
              Reclassificar com IA
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            leftIcon={<History className="h-3 w-3 text-slate-400" />}
            className="text-[11px] py-1 border-slate-800 text-slate-400 hover:bg-slate-900"
          >
            Histórico
          </Button>
        </div>
      </div>

      {/* Exibição Atual */}
      {!isEditing && (
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
          <div>
            <span className="text-[10px] text-slate-500 block">Categoria / Subcategoria</span>
            <span className="font-bold text-white">{organization.category} › {organization.subcategory}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Prioridade</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              organization.priority === 'ALTA' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-300'
            }`}>
              {organization.priority}
            </span>
          </div>
        </div>
      )}

      {/* Formulário de Edição Manual */}
      {isEditing && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Categoria</label>
              <input
                type="text"
                value={categoryDraft}
                onChange={(e) => setCategoryDraft(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Subcategoria</label>
              <input
                type="text"
                value={subcategoryDraft}
                onChange={(e) => setSubcategoryDraft(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Prioridade</label>
              <select
                value={priorityDraft}
                onChange={(e) => setPriorityDraft(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
              >
                <option value="ALTA">🔥 ALTA</option>
                <option value="MEDIA">⚡ MEDIA</option>
                <option value="BAIXA">📌 BAIXA</option>
              </select>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleSaveManualEdit}
              leftIcon={<Check className="h-3.5 w-3.5" />}
              className="bg-blue-600 hover:bg-blue-500 text-xs text-white"
            >
              Salvar Alteração
            </Button>
          </div>
        </div>
      )}

      {/* Histórico de Versões */}
      {showHistory && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-blue-400" /> Histórico de Versões da Classificação
          </h4>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {(organization.versionHistory || []).map((v) => (
              <div key={v.version} className="rounded-lg border border-slate-800 bg-slate-900 p-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200">#v{v.version} ({v.author})</span>
                  <span className="text-[10px] text-slate-500 block">{v.category} › {v.subcategory} • {new Date(v.timestamp).toLocaleTimeString()}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestoreVersion(v)}
                  leftIcon={<RotateCcw className="h-3 w-3 text-blue-400" />}
                  className="text-[10px] py-0.5 border-slate-800 text-blue-300 hover:bg-blue-600/10"
                >
                  Restaurar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
