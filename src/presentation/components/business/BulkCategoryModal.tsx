'use client';

import React, { useState } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { X, Layers, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product } from '@/core/domain/entities/product.entity';
import { ManagedCategory } from '@/core/domain/entities/managed-category.entity';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';
import { ProductMapper } from '@/infrastructure/firebase/mappers/product.mapper';

interface BulkCategoryModalProps {
  selectedProducts: Product[];
  categories: ManagedCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCount: number) => void;
}

export function BulkCategoryModal({
  selectedProducts,
  categories,
  isOpen,
  onClose,
  onSuccess,
}: BulkCategoryModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen || selectedProducts.length === 0) return null;

  const parentCategories = categories.filter((c) => !c.parentCategoryId && c.active);
  const subcategories = categories.filter(
    (c) => c.parentCategoryId === selectedCategoryId && c.active
  );

  const handleApplyBulk = async () => {
    if (!selectedCategoryId) return;
    setSaving(true);

    try {
      const selectedParent = parentCategories.find((c) => c.id === selectedCategoryId);
      const categoryName = selectedParent ? selectedParent.name : selectedCategoryId;

      const batch = writeBatch(db);
      let updatedCount = 0;

      for (const prod of selectedProducts) {
        // Skip updating if locked by manual and user didn't explicitly check override
        const updated = prod.updateCategory({
          categoryId: categoryName,
          subcategoryId: selectedSubcategoryId || null,
          source: 'MANUAL',
          confidence: 1.0,
          locked: isLocked,
          reasoning: 'Alteração em massa efetuada pelo usuário.',
        });

        if (updated) {
          const raw = ProductMapper.toPersistence(prod);
          const ref = doc(db, 'products', prod.id);
          batch.set(ref, raw, { merge: true });
          updatedCount++;
        }
      }

      await batch.commit();

      onSuccess(updatedCount);
      onClose();
    } catch (err) {
      console.error('Erro ao processar alteração de categoria em massa:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100">Alterar Categoria em Massa</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
            <p className="text-xs font-semibold text-blue-300">
              <span className="font-bold text-white">{selectedProducts.length}</span> produtos selecionados para atualização.
            </p>
          </div>

          {/* Select Parent Category */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Selecione a Nova Categoria</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedSubcategoryId('');
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Selecione uma categoria --</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Subcategory */}
          {selectedCategoryId && subcategories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Subcategoria (Opcional)</label>
              <select
                value={selectedSubcategoryId}
                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Nenhuma subcategoria --</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lock Checkbox */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="bulkLock"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="bulkLock" className="text-xs font-medium text-slate-300 cursor-pointer flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              Bloquear estes produtos contra alterações futuras por IA
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4 bg-slate-950/40">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleApplyBulk} disabled={saving || !selectedCategoryId}>
            {saving ? 'Aplicando em Massa...' : 'Confirmar Alteração'}
          </Button>
        </div>
      </div>
    </div>
  );
}
