'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Sparkles, Upload, ArrowRight, Image as ImageIcon, Tag, DollarSign, Truck, Star, Layers, HelpCircle } from 'lucide-react';
import type { ExtractedProductData } from '@/core/domain/ports/marketplaces/IMarketplaceAdapter';

interface ProductConfirmationModalProps {
  data: ExtractedProductData;
  marketplaceSlug: string;
  affiliateUrl: string;
  onConfirm: (confirmedData: ExtractedProductData) => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  'Casa e Cozinha',
  'Eletrônicos & Celulares',
  'Áudio & Fones',
  'Beleza & Perfumaria',
  'Moda & Acessórios',
  'Ferramentas & Construção',
  'Pet Shop',
  'Infantil & Brinquedos',
  'Automotivo',
  'Esportes & Lazer',
  'Games & Consoles',
  'Geral',
];

export const ProductConfirmationModal: React.FC<ProductConfirmationModalProps> = ({
  data,
  marketplaceSlug,
  affiliateUrl,
  onConfirm,
  onCancel,
}) => {
  // Rejeitar títulos que são puramente numéricos (IDs de produto, não nomes)
  const isValidTitle = (t: string) => !!t && t.trim().length > 3 && !/^\d+$/.test(t.trim());

  // Formatar valor numérico como moeda BRL (ex: 99.9 → "99,90")
  const formatBRL = (val: number | null | undefined): string => {
    if (!val || val <= 0) return '';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [title, setTitle] = useState(isValidTitle(data.title) ? data.title : '');
  const [price, setPrice] = useState(formatBRL(data.currentPrice));
  const [prevPrice, setPrevPrice] = useState(formatBRL(data.previousPrice ?? undefined));
  const [image, setImage] = useState(data.mainImage || '');
  const [brand, setBrand] = useState(data.brand && data.brand !== 'Shopee' && data.brand !== 'Desconhecida' ? data.brand : '');
  const [category, setCategory] = useState(data.categoryName || 'Geral');
  const [rating, setRating] = useState(data.reviewsRating && data.reviewsRating > 0 ? String(data.reviewsRating) : '');
  const [shipping, setShipping] = useState(data.shippingInfo || '');

  const score = data.confidenceScore || 0;
  const isAutomatic = score >= 80;
  const isAssisted  = score >= 50 && score < 80;
  const isManual     = score < 50;

  // Handle local file upload (converts to Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'));
    const numericPrevPrice = parseFloat(prevPrice.replace(/[^\d.,]/g, '').replace(',', '.'));
    const numericRating = parseFloat(rating);

    const confirmed: ExtractedProductData = {
      ...data,
      title: title.trim(),
      currentPrice: isNaN(numericPrice) ? 0 : numericPrice,
      previousPrice: isNaN(numericPrevPrice) ? null : numericPrevPrice,
      mainImage: image.trim(),
      brand: brand.trim() || 'Desconhecida',
      categoryName: category.trim() || 'Geral',
      reviewsRating: isNaN(numericRating) ? 4.8 : numericRating,
      shippingInfo: shipping.trim(),
      confidenceScore: 100, // Destravado e confirmado
    };

    onConfirm(confirmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isAutomatic ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isAssisted ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {isAutomatic ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isAutomatic && 'Conferência de Dados (Modo Automático)'}
                {isAssisted  && '🟡 Confirmação Rápida (Modo Assistido)'}
                {isManual    && '⚠️ Precisamos confirmar alguns dados do produto (Modo Manual)'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAutomatic && 'Dados extraídos com alta confiança. Verifique e confirme para a IA criar a oferta.'}
                {isAssisted  && 'Metadados parciais encontrados. Faça os ajustes rápidos abaixo.'}
                {isManual    && 'O marketplace bloqueou as informações automáticas deste link. Confirme os dados abaixo para liberar a criação da oferta com IA.'}
              </p>
            </div>
          </div>

          {/* Confidence Badge */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${isAutomatic ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : isAssisted ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
            <span className={`h-2 w-2 rounded-full ${isAutomatic ? 'bg-emerald-400' : isAssisted ? 'bg-amber-400 animate-pulse' : 'bg-rose-400 animate-pulse'}`} />
            {score}% Confiança ({isAutomatic ? 'Automático' : isAssisted ? 'Assistido' : 'Manual'})
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 🖼️ Image Section (URL or File Upload) */}
            <div className="md:col-span-1 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-3 text-center">
              <span className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                🖼️ Imagem do Produto
              </span>
              {image ? (
                <img src={image} alt="Produto" className="h-36 w-full object-contain rounded-lg bg-slate-900 p-1" />
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                  <ImageIcon className="h-8 w-8 mb-1 opacity-50" />
                  <span className="text-xs">Sem Imagem</span>
                </div>
              )}

              <div className="mt-2 w-full space-y-1.5">
                <input
                  type="url"
                  placeholder="URL da Imagem..."
                  value={image.startsWith('data:') ? '' : image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <label className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700 bg-slate-900 py-1.5 text-[11px] font-medium text-slate-300 cursor-pointer hover:border-blue-500 hover:text-white">
                  <Upload className="h-3.5 w-3.5 text-blue-400" />
                  <span>Upload de Foto</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Product Metadata Inputs */}
            <div className="md:col-span-2 space-y-3">
              {/* 📌 Title */}
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  📌 Nome Oficial do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Garrafa Térmica Inox 1 Litro..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* 💰 Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    💰 Preço Atual (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="99,90"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-emerald-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    🏷️ Preço Anterior (R$)
                  </label>
                  <input
                    type="text"
                    value={prevPrice}
                    onChange={(e) => setPrevPrice(e.target.value)}
                    placeholder="149,90 (Opcional)"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 📂 Category & Marca */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    📂 Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Stanley, Shopee, Nike..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* ⭐ Ratings & 🚚 Shipping */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    ⭐ Avaliação dos Compradores
                  </label>
                  <input
                    type="text"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="Ex: 4.8"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    🚚 Informações de Frete
                  </label>
                  <input
                    type="text"
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                    placeholder="Ex: Frete Grátis / Envio FULL"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checklist de Itens Extraídos */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-xs font-medium text-slate-400">Checklist de Integridade da Extração Automática:</span>
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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>Confirmar Dados e Gerar Oferta com IA ✨</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
