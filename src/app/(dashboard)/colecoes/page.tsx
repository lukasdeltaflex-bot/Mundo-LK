'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { FolderHeart, Plus, Flame, DollarSign, Gift, Home, Sparkles, Smartphone, Rocket, Tag, X, Save, Trash2, Edit3, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';

export interface UserCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'ACTIVE' | 'INACTIVE';
  productCount?: number;
}

export default function ColecoesPage() {
  const { user } = useAuth();
  const [userCollections, setUserCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Flame');
  const [color, setColor] = useState('text-orange-400');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [saving, setSaving] = useState(false);

  const iconOptions = [
    { id: 'Flame', label: 'Fogo / Oferta', Component: Flame },
    { id: 'DollarSign', label: 'Comissão / Dinheiro', Component: DollarSign },
    { id: 'Gift', label: 'Presente', Component: Gift },
    { id: 'Home', label: 'Casa', Component: Home },
    { id: 'Sparkles', label: 'Beleza / Destaque', Component: Sparkles },
    { id: 'Smartphone', label: 'Tecnologia', Component: Smartphone },
    { id: 'Rocket', label: 'Alta', Component: Rocket },
    { id: 'Tag', label: 'Tag Geral', Component: Tag },
  ];

  // Fetch Collections from Firebase
  useEffect(() => {
    async function loadCollections() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'collections'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list: UserCollection[] = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as UserCollection[];

        setUserCollections(list);
      } catch (err) {
        console.warn('Erro ao carregar coleções:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCollections();
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIcon('Flame');
    setColor('text-orange-400');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (col: UserCollection) => {
    setEditingId(col.id);
    setName(col.name);
    setDescription(col.description);
    setIcon(col.icon);
    setColor(col.color);
    setStatus(col.status);
    setIsModalOpen(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setSaving(true);
    setSuccessMsg(null);

    try {
      if (editingId) {
        const docRef = doc(db, 'collections', editingId);
        await updateDoc(docRef, {
          name,
          description,
          icon,
          color,
          status,
          updatedAt: new Date().toISOString(),
        });

        setUserCollections(
          userCollections.map((c) =>
            c.id === editingId ? { ...c, name, description, icon, color, status } : c
          )
        );
        setSuccessMsg('Coleção atualizada no Firebase com sucesso!');
      } else {
        const docRef = await addDoc(collection(db, 'collections'), {
          userId: user.uid,
          name,
          description,
          icon,
          color,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          productCount: 0,
        });

        const newCol: UserCollection = {
          id: docRef.id,
          name,
          description,
          icon,
          color,
          status,
          productCount: 0,
        };

        setUserCollections([newCol, ...userCollections]);
        setSuccessMsg('Nova coleção criada no Firebase com sucesso!');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar coleção:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta coleção?')) return;

    try {
      await deleteDoc(doc(db, 'collections', id));
      setUserCollections(userCollections.filter((c) => c.id !== id));
      setSuccessMsg('Coleção excluída com sucesso.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao excluir coleção:', err);
    }
  };

  const getIconComponent = (iconName: string) => {
    const found = iconOptions.find((i) => i.id === iconName);
    return found ? found.Component : FolderHeart;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderHeart className="h-6 w-6 text-blue-400" />
            <span>Coleções & Listas Temáticas</span>
          </h1>
          <p className="text-sm text-slate-400">Organização personalizada para agrupamento de produtos por temas estratégicos.</p>
        </div>

        <Button size="sm" variant="primary" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={handleOpenCreateModal}>
          Nova Coleção Personalizada
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          Carregando suas coleções reais...
        </div>
      ) : userCollections.length === 0 ? (
        /* Empty State with 0 Mock Data */
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto mb-4">
            <FolderHeart className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nenhuma coleção criada.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Crie sua primeira coleção temática (ex: <i>Ofertas do Dia, Alta Comissão, Presentes, Casa, Tecnologia</i>) para organizar seus produtos.
          </p>
          <Button variant="primary" size="sm" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={handleOpenCreateModal}>
            Criar Primeira Coleção
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userCollections.map((col) => {
            const IconComp = getIconComponent(col.icon);
            return (
              <Card key={col.id} className="p-5 border-slate-800 bg-slate-900/90">
                <CardHeader className="p-0 mb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl bg-slate-950 border border-slate-800 ${col.color}`}>
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={col.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {col.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <button onClick={() => handleOpenEditModal(col)} className="p-1 text-slate-400 hover:text-white">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteCollection(col.id)} className="p-1 text-slate-400 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 space-y-2 text-xs">
                  <CardTitle className="text-base text-white">{col.name}</CardTitle>
                  <CardDescription className="text-xs text-slate-400">{col.description || 'Sem descrição'}</CardDescription>
                  <div className="pt-2 flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-800/80">
                    <span>{col.productCount || 0} produtos vinculados</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Coleção */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-slate-900 border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{editingId ? 'Editar Coleção' : 'Criar Nova Coleção'}</CardTitle>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription className="text-xs">Preencha as informações para organizar seus produtos</CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <form onSubmit={handleSaveCollection} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Nome da Coleção</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ofertas do Dia, Alta Comissão, Casa"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Descrição</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição breve da coleção"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Ícone</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {iconOptions.map((i) => (
                        <option key={i.id} value={i.id}>{i.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Cor do Ícone</label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="text-orange-400">Laranja / Fogo</option>
                      <option value="text-emerald-400">Verde / Dinheiro</option>
                      <option value="text-purple-400">Roxo / Presente</option>
                      <option value="text-blue-400">Azul / Casa</option>
                      <option value="text-pink-400">Rosa / Beleza</option>
                      <option value="text-sky-400">Ciano / Tecnologia</option>
                      <option value="text-amber-400">Âmbar / Alta</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">Ativa</option>
                    <option value="INACTIVE">Inativa</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={saving} leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-3.5 w-3.5" />}>
                    {saving ? 'Salvando...' : 'Salvar no Firebase'}
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
