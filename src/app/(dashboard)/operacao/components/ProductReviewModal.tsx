'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, X, Image as ImageIcon, Check } from 'lucide-react';
import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import { Button } from '@/presentation/components/ui/Button';

interface ProductReviewModalProps {
  data: ProductExtractionResult;
  marketplaceSlug: string;
  onConfirm: (confirmedData: ProductExtractionResult) => void;
  onCancel: () => void;
}

export const ProductReviewModal: React.FC<ProductReviewModalProps> = ({
  data,
  marketplaceSlug,
  onConfirm,
  onCancel,
}) => {
  const [title, setTitle] = useState(data.title || '');
  const [price, setPrice] = useState(data.currentPrice ? String(data.currentPrice) : '');
  const [prevPrice, setPrevPrice] = useState(data.originalPrice ? String(data.originalPrice) : '');
  const [image, setImage] = useState(data.image || '');
  const [brand, setBrand] = useState(data.brand || '');
  const [category, setCategory] = useState(data.category || 'Geral');
  const [seller, setSeller] = useState(data.sellerName || '');
  const [description, setDescription] = useState(data.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const numericPrevPrice = parseFloat(prevPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || null;

    const updated: ProductExtractionResult = {
      ...data,
      title: title.trim(),
      currentPrice: numericPrice,
      originalPrice: numericPrevPrice,
      image: image.trim(),
      brand: brand.trim(),
      category: category.trim(),
      sellerName: seller.trim(),
      description: description.trim(),
    };

    onConfirm(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Tela de Conferência & Edição Manual</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Título do Produto</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Preço Atual (R$)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Preço De / Anterior (R$)</label>
              <input
                type="text"
                value={prevPrice}
                onChange={(e) => setPrevPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Marca / Fabricante</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">URL da Imagem</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Descrição do Produto</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onCancel} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Check className="h-4 w-4" />} className="text-xs font-extrabold">
              Confirmar Dados
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
