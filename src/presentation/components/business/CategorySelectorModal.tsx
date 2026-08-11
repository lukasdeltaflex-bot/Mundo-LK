'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { X, Search, Lock, Unlock, Check, Sparkles, User, Brain, AlertCircle } from 'lucide-react';
import { Product } from '@/core/domain/entities/product.entity';
import { ManagedCategory } from '@/core/domain/entities/managed-category.entity';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreCategoryPreferenceRepository } from '@/infrastructure/firebase/repositories/firestore-category-preference.repository';

interface CategorySelectorModalProps {
  product: Product | null;
  categories: ManagedCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
}

export function CategorySelectorModal({
  product,
  categories,
  isOpen,
  onClose,
  onSuccess,
}: CategorySelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      // Find matching category ID or name
      const mainCat = categories.find(
        (c) => !c.parentCategoryId && (c.id === product.categoryId || c.name === product.categoryId)
      );
      setSelectedCategoryId(mainCat ? mainCat.id : product.categoryId || '');
      setSelectedSubcategoryId(product.subcategoryId || '');
      setIsLocked(product.categoryLocked ?? false);
    }
  }, [product, categories]);

  if (!isOpen || !product) return null;

  const parentCategories = categories.filter((c) => !c.parentCategoryId && c.active);
  const subcategories = categories.filter(
    (c) => c.parentCategoryId === selectedCategoryId && c.active
  );

  const filteredParents = parentCategories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedParent = parentCategories.find((c) => c.id === selectedCategoryId);
      const selectedSub = subcategories.find((c) => c.id === selectedSubcategoryId);

      const categoryName = selectedParent ? selectedParent.name : selectedCategoryId;

      // Update product category domain entity
      product.updateCategory({
        categoryId: categoryName,
        subcategoryId: selectedSubcategoryId || null,
        source: 'MANUAL',
        confidence: 1.0,
        locked: isLocked,
        reasoning: 'Classificação manual definida pelo usuário.',
      });

      // Save updated product to Firestore
      const repo = new FirestoreProductRepository();
      await repo.save(product);

      // Record correction to Category Memory (user_category_preferences)
      if (selectedParent) {
        try {
          const prefRepo = new FirestoreCategoryPreferenceRepository();
          await prefRepo.recordCorrection({
            userId: product.userId,
            productTitle: product.title,
            targetCategoryId: selectedParent.id,
            targetCategoryName: selectedParent.name,
            targetSubcategoryId: selectedSub?.id || null,
            targetSubcategoryName: selectedSub?.name || null,
          });
        } catch (memErr) {
          console.warn('[CategorySelectorModal] Erro ao gravar preferência de memória:', memErr);
        }
      }

      onSuccess(product);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar categoria do produto:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100">Categorização Manual</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Product Summary Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex items-center gap-3">
            {product.images && product.images[0] ? (
              <img src={product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover border border-slate-800" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                {product.title.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{product.title}</p>
              <p className="text-[11px] text-slate-500 truncate">Marca: {product.brand || 'Geral'}</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Main Category Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Categoria Principal</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredParents.map((cat) => {
                const isSelected = selectedCategoryId === cat.id || selectedCategoryId === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSelectedSubcategoryId('');
                    }}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium border transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory Selection */}
          {selectedCategoryId && subcategories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Subcategoria (Opcional)</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubcategoryId('')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                    !selectedSubcategoryId
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Nenhuma
                </button>
                {subcategories.map((sub) => {
                  const isSubSelected = selectedSubcategoryId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubcategoryId(sub.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                        isSubSelected
                          ? 'border-blue-500/50 bg-blue-500/20 text-blue-300 font-bold'
                          : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lock Safeguard Toggle */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`mt-0.5 rounded-lg p-2 transition ${
                isLocked ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Bloquear alteração por IA</span>
                {isLocked && <Badge variant="warning" className="text-[10px]">🔒 Ativo</Badge>}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Quando ativado, a IA **nunca** poderá alterar esta categoria em novas importações, sincronizações ou execuções em lote.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4 bg-slate-950/40">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !selectedCategoryId}>
            {saving ? 'Salvando...' : 'Confirmar e Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
