'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, Upload, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';

interface ProductConfirmationModalProps {
  data: ProductExtractionResult;
  marketplaceSlug: string;
  affiliateUrl: string;
  onConfirm: (confirmedData: ProductExtractionResult) => void;
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

const MARKETPLACE_OPTIONS = [
  { slug: 'mercadolivre', label: 'Mercado Livre' },
  { slug: 'shopee', label: 'Shopee' },
  { slug: 'shein', label: 'SHEIN' },
  { slug: 'amazon', label: 'Amazon' },
  { slug: 'outros', label: 'Outro' },
];

export const ProductConfirmationModal: React.FC<ProductConfirmationModalProps> = ({
  data,
  marketplaceSlug,
  affiliateUrl,
  onConfirm,
  onCancel,
}) => {
  const isValidTitle = (t: string) => !!t && t.trim().length > 3 && !/^\d+$/.test(t.trim());

  const formatBRL = (val: number | null | undefined): string => {
    if (!val || val <= 0) return '';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const initialMkt = (marketplaceSlug || data.marketplace || '').toLowerCase();
  const isMktAutoDetected = ['shopee', 'mercadolivre', 'amazon', 'shein', 'magalu', 'aliexpress', 'tiktokshop'].includes(initialMkt);

  const [selectedMarketplace, setSelectedMarketplace] = useState<string>(
    isMktAutoDetected ? initialMkt : 'shopee'
  );

  const [title, setTitle] = useState(isValidTitle(data.title) ? data.title : '');
  const [price, setPrice] = useState(formatBRL(data.currentPrice));
  const [prevPrice, setPrevPrice] = useState(formatBRL(data.originalPrice));
  const [image, setImage] = useState(data.image || '');
  const [brand, setBrand] = useState(data.brand && data.brand !== 'Shopee' && data.brand !== 'Desconhecida' ? data.brand : '');
  const [category, setCategory] = useState(data.category || 'Geral');
  const [seller, setSeller] = useState(data.sellerName || '');
  const [rating, setRating] = useState(data.rating && data.rating > 0 ? String(data.rating) : '');
  const [shipping, setShipping] = useState(data.shippingType || '');
  const [description, setDescription] = useState(data.description || '');
  const [coupon, setCoupon] = useState(data.coupon || '');
  const [cashback, setCashback] = useState(data.cashback || '');

  const score = (data as any).confidenceScore ?? 80;
  const isAutomatic = score >= 80;
  const isAssisted  = score >= 50 && score < 80;
  const isManual     = score < 50;

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

    const finalMarketplace = isMktAutoDetected ? initialMkt : selectedMarketplace;

    const confirmed: ProductExtractionResult = {
      ...data,
      marketplace: finalMarketplace,
      title: title.trim(),
      description: description.trim(),
      currentPrice: isNaN(numericPrice) ? 0 : numericPrice,
      originalPrice: isNaN(numericPrevPrice) ? null : numericPrevPrice,
      discountPercentage: (!isNaN(numericPrevPrice) && !isNaN(numericPrice) && numericPrevPrice > numericPrice)
        ? Math.round(((numericPrevPrice - numericPrice) / numericPrevPrice) * 100)
        : data.discountPercentage,
      image: image.trim(),
      brand: brand.trim() || 'Desconhecida',
      category: category.trim() || 'Geral',
      sellerName: seller.trim(),
      coupon: coupon.trim(),
      cashback: cashback.trim(),
      rating: isNaN(numericRating) ? 4.8 : numericRating,
      shippingType: shipping.trim() || 'Envio Padrão',
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
                Verifique e ajuste os dados reais do produto antes de gerar a oferta com IA.
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${isAutomatic ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : isAssisted ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
            <span className={`h-2 w-2 rounded-full ${isAutomatic ? 'bg-emerald-400' : isAssisted ? 'bg-amber-400 animate-pulse' : 'bg-rose-400 animate-pulse'}`} />
            {score}% Confiança ({isAutomatic ? 'Automático' : isAssisted ? 'Assistido' : 'Manual'})
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 🖼️ Image Section */}
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

            {/* Inputs */}
            <div className="md:col-span-2 space-y-3">
              {/* Fallback Manual de Marketplace quando não identificado automaticamente */}
              {!isMktAutoDetected && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <label className="text-xs font-bold text-amber-300 block mb-1.5">
                    ⚠️ Marketplace não identificado. Selecione uma opção:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MARKETPLACE_OPTIONS.map((mkt) => (
                      <button
                        key={mkt.slug}
                        type="button"
                        onClick={() => setSelectedMarketplace(mkt.slug)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                          selectedMarketplace === mkt.slug
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                        }`}
                      >
                        {mkt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
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

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-300">📝 Descrição / Detalhes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do produto..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Prices */}
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

              {/* Category & Brand */}
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
                    placeholder="Ex: Stanley, Nike..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Store & Shipping */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    🏪 Loja / Vendedor
                  </label>
                  <input
                    type="text"
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    placeholder="Ex: Loja Oficial"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    🎟️ Cupom / Promoção
                  </label>
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Ex: CUPOM10"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
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
