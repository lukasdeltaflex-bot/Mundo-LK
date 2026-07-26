'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Sparkles, Edit3, ArrowRight, Image as ImageIcon, Tag, DollarSign, ExternalLink } from 'lucide-react';
import type { ExtractedProductData } from '@/core/domain/ports/marketplaces/IMarketplaceAdapter';

interface ProductConfirmationModalProps {
  data: ExtractedProductData;
  marketplaceSlug: string;
  affiliateUrl: string;
  onConfirm: (confirmedData: ExtractedProductData) => void;
  onCancel: () => void;
}

export const ProductConfirmationModal: React.FC<ProductConfirmationModalProps> = ({
  data,
  marketplaceSlug,
  affiliateUrl,
  onConfirm,
  onCancel,
}) => {
  const [title, setTitle] = useState(data.title || '');
  const [price, setPrice] = useState(data.currentPrice ? String(data.currentPrice) : '');
  const [prevPrice, setPrevPrice] = useState(data.previousPrice ? String(data.previousPrice) : '');
  const [image, setImage] = useState(data.mainImage || '');
  const [brand, setBrand] = useState(data.brand || '');
  const [category, setCategory] = useState(data.categoryName || 'Geral');
  const [shipping, setShipping] = useState(data.shippingInfo || 'Frete Padrão');
  const [isEditing, setIsEditing] = useState(data.confidenceScore < 80);

  const isHighConfidence = data.confidenceScore >= 80;

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'));
    const numericPrevPrice = parseFloat(prevPrice.replace(/[^\d.,]/g, '').replace(',', '.'));

    const confirmed: ExtractedProductData = {
      ...data,
      title: title.trim(),
      currentPrice: isNaN(numericPrice) ? 0 : numericPrice,
      previousPrice: isNaN(numericPrevPrice) ? null : numericPrevPrice,
      mainImage: image.trim(),
      brand: brand.trim() || 'Desconhecida',
      categoryName: category.trim() || 'Geral',
      shippingInfo: shipping.trim(),
      confidenceScore: 100, // Manually verified by user
    };

    onConfirm(confirmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isHighConfidence ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              {isHighConfidence ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Conferência dos Dados do Anúncio</h2>
              <p className="text-xs text-slate-400">Verifique os dados reais do produto antes da IA criar a copy de alta conversão.</p>
            </div>
          </div>

          {/* Confidence Badge */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isHighConfidence ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`}>
            <span className={`h-2 w-2 rounded-full ${isHighConfidence ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
            Confiança: {data.confidenceScore}%
          </div>
        </div>

        {/* Warning if confidence < 80% */}
        {!isHighConfidence && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Atenção: A extração automática ficou abaixo de 80%</span>
            </div>
            <p className="mt-1 text-slate-300">
              O link encurtado ou a página possui proteção. Por favor, confirme o título, preço e imagem abaixo antes de liberar a IA.
            </p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleConfirmSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Image Preview & Input */}
            <div className="md:col-span-1 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
              {image ? (
                <img src={image} alt="Produto" className="h-36 w-full object-contain rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-xs">Sem Imagem</span>
                </div>
              )}
              {isEditing && (
                <input
                  type="url"
                  placeholder="URL da Imagem..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Product Metadata Inputs */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Título Oficial do Produto *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Garrafa Térmica Inox 1 Litro..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Preço Atual (R$) *</label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="99,90"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Preço Anterior (R$)</label>
                  <input
                    type="text"
                    value={prevPrice}
                    onChange={(e) => setPrevPrice(e.target.value)}
                    placeholder="149,90"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Stanley, Shopee, Nike..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">Categoria</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Casa e Cozinha"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checklist de Itens Extraídos */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-xs font-medium text-slate-400">Checklist de Integridade da Extração:</span>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {data.confidenceItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                  {item.found ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  )}
                  <span className={item.found ? 'text-slate-200' : 'text-slate-500 line-through'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || title.length < 3}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>Confirmar Dados e Gerar Oferta com IA</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
