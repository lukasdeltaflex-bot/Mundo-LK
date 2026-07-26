'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  GripVertical,
  RotateCcw,
  Save,
  CheckCircle2,
  Loader2,
  Menu,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { useMenuOrder, ALL_MENU_ITEMS, type MenuItemDefinition } from '@/presentation/context/MenuOrderContext';

// ─── Drag State ───────────────────────────────────────────────────────────────

interface DragState {
  draggingId: string | null;
  overIndex: number | null;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function OrganizarMenuPage() {
  const { orderedItems, saveOrder, resetOrder, isLoading } = useMenuOrder();

  // Local working copy (preview before save)
  const [localItems, setLocalItems] = useState<MenuItemDefinition[]>([]);
  const [drag, setDrag] = useState<DragState>({ draggingId: null, overIndex: null });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  // Sync local copy when context loads
  useEffect(() => {
    setLocalItems([...orderedItems]);
    setIsDirty(false);
  }, [orderedItems]);

  // ── Drag Handlers ──────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent<HTMLLIElement>, index: number) => {
    dragIndexRef.current = index;
    setDrag((d) => ({ ...d, draggingId: localItems[index].id }));
    e.dataTransfer.effectAllowed = 'move';
    // Ghost image trick: transparent 1x1 px
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, [localItems]);

  const handleDragEnter = useCallback((_e: React.DragEvent<HTMLLIElement>, index: number) => {
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    setDrag((d) => ({ ...d, overIndex: index }));
    setLocalItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndexRef.current!, 1);
      next.splice(index, 0, moved);
      dragIndexRef.current = index;
      return next;
    });
    setIsDirty(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDrag({ draggingId: null, overIndex: null });
  }, []);

  // ── Arrow Button Reorder ───────────────────────────────────────────────────

  const move = useCallback((index: number, direction: 'up' | 'down') => {
    setLocalItems((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setIsDirty(true);
  }, []);

  // ── Save & Reset ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      await saveOrder(localItems.map((i) => i.id));
      setIsDirty(false);
      setSuccessMsg('Ordem do menu salva com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setSuccessMsg('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await resetOrder();
      setIsDirty(false);
      setSuccessMsg('Ordem padrão restaurada!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400 text-xs gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        Carregando preferências do menu...
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Menu className="h-6 w-6 text-blue-400" />
          Organizar Menu
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Arraste os itens para reorganizar o menu lateral na ordem que preferir. A configuração é salva por usuário.
        </p>
      </div>

      {/* Success / Feedback Banner */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Dirty state notice */}
      {isDirty && !successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-400">
          <Sparkles className="h-4 w-4 shrink-0" />
          Você tem alterações não salvas.
        </div>
      )}

      {/* Drag & Drop List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Itens do Menu Lateral
          </span>
          <span className="text-[10px] text-slate-500">{localItems.length} itens</span>
        </div>

        <ul className="divide-y divide-slate-800/60">
          {localItems.map((item, index) => {
            const Icon = item.icon;
            const isDragging = drag.draggingId === item.id;

            return (
              <li
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
                className={`
                  group flex items-center gap-3 px-5 py-3.5 transition-all duration-150 cursor-grab active:cursor-grabbing select-none
                  ${isDragging
                    ? 'opacity-40 scale-[0.98] bg-blue-600/5 border-l-2 border-blue-500'
                    : 'hover:bg-slate-800/40'
                  }
                `}
              >
                {/* Drag Handle */}
                <GripVertical
                  className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition shrink-0"
                />

                {/* Position Badge */}
                <span className="text-[10px] font-bold text-slate-600 w-5 text-center shrink-0">
                  {index + 1}
                </span>

                {/* Icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-slate-700 transition">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>

                {/* Label */}
                <span className="flex-1 text-sm font-semibold text-slate-200">{item.name}</span>

                {/* Arrow controls (keyboard / touch fallback) */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button
                    type="button"
                    onClick={() => move(index, 'up')}
                    disabled={index === 0}
                    title="Mover para cima"
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 'down')}
                    disabled={index === localItems.length - 1}
                    title="Mover para baixo"
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Preview Panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Pré-visualização do Menu
          </span>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {localItems.slice(0, 9).map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300"
              >
                <span className="text-[9px] font-bold text-slate-600 w-4">{idx + 1}</span>
                <Icon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
            );
          })}
          {localItems.length > 9 && (
            <div className="flex items-center justify-center px-3 py-2 rounded-xl bg-slate-800/30 border border-dashed border-slate-700 text-[10px] text-slate-500 col-span-1">
              +{localItems.length - 9} itens
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar Padrão
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed
            ${isDirty
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {isSaving ? 'Salvando...' : 'Salvar Ordem'}
        </button>
      </div>

      {/* Tip */}
      <p className="text-center text-[10px] text-slate-600">
        💡 Arraste os itens com o mouse ou use as setas ↑ ↓. A configuração é vinculada à sua conta e sincronizada automaticamente.
      </p>
    </div>
  );
}
