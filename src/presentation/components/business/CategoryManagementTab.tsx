'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Plus, Tag, Layers, Edit2, Trash2, CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck, Power } from 'lucide-react';
import { ManagedCategory } from '@/core/domain/entities/managed-category.entity';
import { Product } from '@/core/domain/entities/product.entity';
import { FirestoreCategoryRepository } from '@/infrastructure/firebase/repositories/firestore-category.repository';
import { useAuth } from '@/presentation/context/AuthContext';

interface CategoryManagementTabProps {
  categories: ManagedCategory[];
  products: Product[];
  onRefresh: () => void;
}

export function CategoryManagementTab({
  categories,
  products,
  onRefresh,
}: CategoryManagementTabProps) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ManagedCategory | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string>('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Calculate live product count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
      if (p.subcategoryId) {
        counts[p.subcategoryId] = (counts[p.subcategoryId] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  const parentCategories = categories.filter((c) => !c.parentCategoryId);

  const handleOpenCreate = (parentId: string = '') => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setParentCategoryId(parentId);
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: ManagedCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setParentCategoryId(cat.parentCategoryId || '');
    setActive(cat.active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user?.uid || saving) return;

    const trimmedName = name.trim();
    const targetParentId = parentCategoryId || null;

    // Check for duplicate category/subcategory name under the same parent
    const isDuplicate = categories.some(
      (c) =>
        (!editingCategory || c.id !== editingCategory.id) &&
        (c.parentCategoryId ?? null) === targetParentId &&
        c.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      alert(`Já existe uma ${targetParentId ? 'subcategoria' : 'categoria'} com o nome "${trimmedName}".`);
      return;
    }

    setSaving(true);

    try {
      const repo = new FirestoreCategoryRepository();

      if (editingCategory) {
        editingCategory.updateInfo({
          name: trimmedName,
          description: description.trim(),
          parentCategoryId: targetParentId,
          active,
        });
        await repo.save(editingCategory);
      } else {
        const newCat = new ManagedCategory({
          id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId: user.uid,
          name: trimmedName,
          description: description.trim(),
          parentCategoryId: targetParentId,
          active,
        });
        await repo.save(newCat);
      }

      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('[CategoryManagementTab] Erro ao salvar categoria/subcategoria:', err);
      alert('Ocorreu um erro ao salvar a categoria no Firestore. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: ManagedCategory) => {
    try {
      if (cat.active) {
        cat.deactivate();
      } else {
        cat.activate();
      }
      const repo = new FirestoreCategoryRepository();
      await repo.save(cat);
      onRefresh();
    } catch (err) {
      console.error('Erro ao alterar status da categoria:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Central Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-400" />
            Central de Categorias
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie as categorias e subcategorias do seu catálogo. As alterações são sincronizadas com a IA e os seletores do catálogo.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => handleOpenCreate('')} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Categoria
        </Button>
      </div>

      {/* Category Tree Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {parentCategories.map((parent) => {
          const subCats = categories.filter(
            (c) =>
              c.parentCategoryId === parent.id ||
              (parent.slug && c.parentCategoryId === parent.slug) ||
              (parent.name && c.parentCategoryId === parent.name)
          );
          const count = categoryCounts[parent.id] || categoryCounts[parent.name] || 0;

          return (
            <Card key={parent.id} className={`border transition ${parent.active ? 'border-slate-800 bg-slate-900/40' : 'border-slate-800/40 bg-slate-950/40 opacity-60'}`}>
              <CardHeader className="pb-3 border-b border-slate-800/60 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-slate-200">{parent.name}</CardTitle>
                    {!parent.active && <Badge variant="neutral" className="text-[9px]">Inativa</Badge>}
                  </div>
                  <CardDescription className="text-[11px] text-slate-500 mt-0.5">
                    {count} {count === 1 ? 'produto vinculado' : 'produtos vinculados'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(parent)}
                    title={parent.active ? 'Desativar Categoria' : 'Ativar Categoria'}
                    className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition`}
                  >
                    <Power className={`h-3.5 w-3.5 ${parent.active ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(parent)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-3 space-y-2">
                {subCats.length > 0 ? (
                  <div className="space-y-1.5">
                    {subCats.map((sub) => {
                      const subCount = categoryCounts[sub.id] || 0;
                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between rounded-lg bg-slate-950/50 border border-slate-800/40 px-3 py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <ChevronRight className="h-3 w-3 text-slate-500" />
                            <span className={`truncate font-medium ${sub.active ? 'text-slate-300' : 'text-slate-500 line-through'}`}>
                              {sub.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">{subCount}</span>
                            <button
                              onClick={() => handleOpenEdit(sub)}
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic py-1">Nenhuma subcategoria criada.</p>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenCreate(parent.id)}
                  className="w-full text-[11px] py-1 mt-2 bg-slate-950 border-slate-800 hover:bg-slate-900"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Subcategoria
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <h3 className="font-semibold text-slate-100">
                  {editingCategory ? 'Editar Categoria' : parentCategoryId ? 'Nova Subcategoria' : 'Nova Categoria'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Cuidados com a Pele"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Descrição (Opcional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição breve..."
                    rows={2}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Categoria Pai</label>
                  <select
                    value={parentCategoryId}
                    onChange={(e) => setParentCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Nenhuma (Categoria Principal)</option>
                    {parentCategories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="catActive" className="text-xs font-medium text-slate-300">
                    Categoria Ativa
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4 bg-slate-950/40">
                <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Categoria'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
