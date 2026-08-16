'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { X, Settings, Plus, Edit2, Trash2, ShieldAlert, AlertTriangle, Radio, Users, Check, GripVertical, Loader2 } from 'lucide-react';
import { DispatchChannel } from '@/core/domain/entities/dispatch-channel.entity';
import { TargetGroup } from '@/core/domain/entities/target-group.entity';
import { Product } from '@/core/domain/entities/product.entity';
import { FirestoreDispatchChannelRepository } from '@/infrastructure/firebase/repositories/firestore-dispatch-channel.repository';
import { FirestoreTargetGroupRepository } from '@/infrastructure/firebase/repositories/firestore-target-group.repository';
import { useAuth } from '@/presentation/context/AuthContext';

interface DispatchOptionsManagerModalProps {
  channels: DispatchChannel[];
  groups: TargetGroup[];
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function DispatchOptionsManagerModal({
  channels,
  groups,
  products,
  isOpen,
  onClose,
  onRefresh,
}: DispatchOptionsManagerModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'channels' | 'groups'>('channels');

  // Local reorderable list states
  const [localChannels, setLocalChannels] = useState<DispatchChannel[]>([]);
  const [localGroups, setLocalGroups] = useState<TargetGroup[]>([]);

  // Dragging state
  const draggedIndexRef = useRef<number | null>(null);

  // Reorder Feedback Message
  const [orderStatus, setOrderStatus] = useState<{ type: 'saving' | 'success' | 'error'; text: string } | null>(null);

  // Form states for Create/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  // Delete confirmation state
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; type: 'channel' | 'group' } | null>(null);

  // Sync local items sorted by order ASC
  useEffect(() => {
    const sortedChans = [...channels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setLocalChannels(sortedChans);
  }, [channels]);

  useEffect(() => {
    const sortedGrps = [...groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setLocalGroups(sortedGrps);
  }, [groups]);

  if (!isOpen) return null;

  // Audit Usage Count in existing Products
  const getItemUsageCount = (name: string, type: 'channel' | 'group'): number => {
    let count = 0;
    const lowerName = name.toLowerCase().trim();

    products.forEach((p) => {
      if (type === 'channel') {
        if (p.lastChannel && p.lastChannel.toLowerCase().trim() === lowerName) count++;
        if (p.dispatchHistory && p.dispatchHistory.some((h) => h.channel && h.channel.toLowerCase().trim() === lowerName)) count++;
      } else {
        if (p.dispatchHistory && p.dispatchHistory.some((h) => h.targetGroup && h.targetGroup.toLowerCase().trim() === lowerName)) count++;
      }
    });

    return count;
  };

  const handleOpenCreate = () => {
    setEditingItemId(null);
    setItemName('');
    setItemDescription('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (id: string, name: string, description: string = '') => {
    setEditingItemId(id);
    setItemName(name);
    setItemDescription(description);
    setIsFormOpen(true);
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    draggedIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropChannel = async (targetIndex: number) => {
    const fromIdx = draggedIndexRef.current;
    if (fromIdx === null || fromIdx === targetIndex) return;

    const listCopy = [...localChannels];
    const [moved] = listCopy.splice(fromIdx, 1);
    listCopy.splice(targetIndex, 0, moved);

    // Update order property for all items based on new positions
    listCopy.forEach((item, idx) => item.updateOrder(idx));
    setLocalChannels([...listCopy]);

    setOrderStatus({ type: 'saving', text: '⏳ Salvando nova ordem no Firestore...' });

    try {
      const repo = new FirestoreDispatchChannelRepository();
      await repo.saveBatch(listCopy);
      setOrderStatus({ type: 'success', text: '✓ Ordem salva no Firestore' });
      onRefresh();
      setTimeout(() => setOrderStatus(null), 3000);
    } catch (err) {
      console.error('[DispatchOptionsManagerModal] Erro ao salvar ordem dos canais:', err);
      setOrderStatus({ type: 'error', text: '⚠ Não foi possível salvar a nova ordem.' });
      // Revert UI to props state
      setLocalChannels([...channels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setTimeout(() => setOrderStatus(null), 4000);
    }
  };

  const handleDropGroup = async (targetIndex: number) => {
    const fromIdx = draggedIndexRef.current;
    if (fromIdx === null || fromIdx === targetIndex) return;

    const listCopy = [...localGroups];
    const [moved] = listCopy.splice(fromIdx, 1);
    listCopy.splice(targetIndex, 0, moved);

    // Update order property for all items based on new positions
    listCopy.forEach((item, idx) => item.updateOrder(idx));
    setLocalGroups([...listCopy]);

    setOrderStatus({ type: 'saving', text: '⏳ Salvando nova ordem no Firestore...' });

    try {
      const repo = new FirestoreTargetGroupRepository();
      await repo.saveBatch(listCopy);
      setOrderStatus({ type: 'success', text: '✓ Ordem salva no Firestore' });
      onRefresh();
      setTimeout(() => setOrderStatus(null), 3000);
    } catch (err) {
      console.error('[DispatchOptionsManagerModal] Erro ao salvar ordem dos grupos:', err);
      setOrderStatus({ type: 'error', text: '⚠ Não foi possível salvar a nova ordem.' });
      // Revert UI to props state
      setLocalGroups([...groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setTimeout(() => setOrderStatus(null), 4000);
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = itemName.trim();
    if (!trimmedName || !user?.uid || processing) return;

    // Check case-insensitive duplicates
    if (activeTab === 'channels') {
      const isDup = channels.some(
        (c) => c.id !== editingItemId && c.name.toLowerCase().trim() === trimmedName.toLowerCase()
      );
      if (isDup) {
        alert(`Já existe um Canal de Divulgação cadastrado com o nome "${trimmedName}".`);
        return;
      }
    } else {
      const isDup = groups.some(
        (g) => g.id !== editingItemId && g.name.toLowerCase().trim() === trimmedName.toLowerCase()
      );
      if (isDup) {
        alert(`Já existe um Grupo / Lista de Destino cadastrado com o nome "${trimmedName}".`);
        return;
      }
    }

    setProcessing(true);
    try {
      if (activeTab === 'channels') {
        const repo = new FirestoreDispatchChannelRepository();
        if (editingItemId) {
          const existing = channels.find((c) => c.id === editingItemId);
          if (existing) {
            existing.updateName(trimmedName);
            await repo.save(existing);
          }
        } else {
          const nextOrder = localChannels.length;
          const newChan = new DispatchChannel({
            id: `chan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId: user.uid,
            name: trimmedName,
            order: nextOrder,
            active: true,
          });
          await repo.save(newChan);
        }
      } else {
        const repo = new FirestoreTargetGroupRepository();
        if (editingItemId) {
          const existing = groups.find((g) => g.id === editingItemId);
          if (existing) {
            existing.updateInfo(trimmedName, itemDescription.trim());
            await repo.save(existing);
          }
        } else {
          const nextOrder = localGroups.length;
          const newGroup = new TargetGroup({
            id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            userId: user.uid,
            name: trimmedName,
            description: itemDescription.trim(),
            order: nextOrder,
            active: true,
          });
          await repo.save(newGroup);
        }
      }

      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('[DispatchOptionsManagerModal] Erro ao salvar opção:', {
        tab: activeTab,
        code: err?.code,
        message: err?.message,
        name: err?.name,
        err,
      });
      const errCode = err?.code ? `[${err.code}] ` : '';
      const errMsg = err?.message || String(err);
      alert(`Erro ao salvar no Firestore: ${errCode}${errMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem || processing) return;
    setProcessing(true);

    try {
      if (deletingItem.type === 'channel') {
        const repo = new FirestoreDispatchChannelRepository();
        await repo.delete(deletingItem.id);
      } else {
        const repo = new FirestoreTargetGroupRepository();
        await repo.delete(deletingItem.id);
      }

      setDeletingItem(null);
      onRefresh();
    } catch (err: any) {
      console.error('[DispatchOptionsManagerModal] Erro ao excluir opção:', {
        deletingItem,
        code: err?.code,
        message: err?.message,
        name: err?.name,
        err,
      });
      const errCode = err?.code ? `[${err.code}] ` : '';
      const errMsg = err?.message || String(err);
      alert(`Erro ao excluir do Firestore: ${errCode}${errMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100">Gerenciar Opções do Canal de Registro</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-6 py-2 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('channels'); setIsFormOpen(false); setOrderStatus(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'channels'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            Canais de Divulgação ({localChannels.length})
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('groups'); setIsFormOpen(false); setOrderStatus(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'groups'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Grupos / Listas de Destino ({localGroups.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Status Alert for Reordering */}
          {orderStatus && (
            <div
              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold animate-in fade-in ${
                orderStatus.type === 'saving'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : orderStatus.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-300 border border-red-500/20'
              }`}
            >
              {orderStatus.type === 'saving' && <Loader2 className="h-4 w-4 animate-spin text-blue-400 shrink-0" />}
              {orderStatus.type === 'success' && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
              {orderStatus.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />}
              <span>{orderStatus.text}</span>
            </div>
          )}

          {/* Action Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {activeTab === 'channels'
                ? 'Arraste pelo ícone ☰ para reordenar a prioridade dos canais.'
                : 'Arraste pelo ícone ☰ para reordenar os grupos de destino.'}
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              className="shrink-0 text-xs"
            >
              Cadastrar {activeTab === 'channels' ? 'Canal' : 'Grupo'}
            </Button>
          </div>

          {/* Form Modal Subview */}
          {isFormOpen && (
            <form onSubmit={handleSaveSubmit} className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-blue-300">
                {editingItemId ? 'Editar Opção' : 'Cadastrar Nova Opção'}
              </h4>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={activeTab === 'channels' ? 'Ex: Telegram Promoções' : 'Ex: Grupo VIP #02'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {activeTab === 'groups' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Descrição Opcional</label>
                  <input
                    type="text"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Ex: Clientes interessados em eletrônicos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  disabled={processing}
                  className="text-xs py-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={processing}
                  className="text-xs py-1"
                >
                  {processing ? 'Salvando...' : 'Salvar Opção'}
                </Button>
              </div>
            </form>
          )}

          {/* Delete Confirmation Alert */}
          {deletingItem && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2 text-xs text-red-300">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white mb-1">Confirmar Exclusão de "{deletingItem.name}"?</p>
                  {getItemUsageCount(deletingItem.name, deletingItem.type) > 0 ? (
                    <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 p-2 rounded-lg mt-1">
                      ⚠️ Esta opção está vinculada a <span className="font-bold text-white">{getItemUsageCount(deletingItem.name, deletingItem.type)} histórico(s) de produtos</span>. Os registros do catálogo serão preservados.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-300">Esta opção será removida permanentemente do Firestore.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingItem(null)}
                  disabled={processing}
                  className="text-xs py-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={processing}
                  className="text-xs py-1"
                >
                  {processing ? 'Excluindo...' : 'Excluir Opção'}
                </Button>
              </div>
            </div>
          )}

          {/* Reorderable Items List */}
          <div className="space-y-2">
            {activeTab === 'channels' ? (
              localChannels.length > 0 ? (
                localChannels.map((chan, idx) => {
                  const usage = getItemUsageCount(chan.name, 'channel');
                  return (
                    <div
                      key={chan.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropChannel(idx)}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs hover:border-slate-700 transition cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="text-slate-600 group-hover:text-slate-300 transition cursor-grab"
                          title="Arrastar para reordenar"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-200">{chan.name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                          </div>
                          {usage > 0 && (
                            <span className="text-[10px] text-blue-400 font-medium">
                              Usado em {usage} {usage === 1 ? 'registro' : 'registros'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(chan.id, chan.name)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                          title="Editar Nome"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingItem({ id: chan.id, name: chan.name, type: 'channel' })}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
                          title="Excluir Opção"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 italic py-3 text-center">Nenhum canal cadastrado.</p>
              )
            ) : localGroups.length > 0 ? (
              localGroups.map((grp, idx) => {
                const usage = getItemUsageCount(grp.name, 'group');
                return (
                  <div
                    key={grp.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropGroup(idx)}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs hover:border-slate-700 transition cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="text-slate-600 group-hover:text-slate-300 transition cursor-grab"
                        title="Arrastar para reordenar"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-200">{grp.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                        </div>
                        {grp.description && (
                          <p className="text-[11px] text-slate-400">{grp.description}</p>
                        )}
                        {usage > 0 && (
                          <span className="text-[10px] text-blue-400 font-medium">
                            Usado em {usage} {usage === 1 ? 'registro' : 'registros'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(grp.id, grp.name, grp.description)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                        title="Editar Grupo/Lista"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingItem({ id: grp.id, name: grp.name, type: 'group' })}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
                        title="Excluir Opção"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 italic py-3 text-center">Nenhum grupo/lista cadastrado.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 px-6 py-3.5 bg-slate-950/40">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
