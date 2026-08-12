'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { X, Edit3, Image as ImageIcon, Package, Tag, DollarSign, Layers } from 'lucide-react';
import { Product } from '@/core/domain/entities/product.entity';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { UpdateProductUseCase } from '@/core/application/use-cases/products/UpdateProductUseCase';
import { Price } from '@/core/domain/value-objects/price.vo';
import { useAuth } from '@/presentation/context/AuthContext';

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currentPriceAmount, setCurrentPriceAmount] = useState('');
  const [previousPriceAmount, setPreviousPriceAmount] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (product) {
      setTitle(product.title || '');
      setDescription(product.description || '');
      setBrand(product.brand || '');
      setCategoryId(product.categoryId || '');
      setCurrentPriceAmount(product.currentPrice?.amount ? String(product.currentPrice.amount) : '');
      setPreviousPriceAmount(product.previousPrice?.amount ? String(product.previousPrice.amount) : '');
      setMainImageUrl(product.images && product.images.length > 0 ? product.images[0] : '');
      setGalleryUrls(product.images && product.images.length > 1 ? product.images.slice(1).join('\n') : '');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || processing) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('O título do produto é obrigatório.');
      return;
    }

    const priceNum = parseFloat(currentPriceAmount.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Informe um preço atual válido maior que zero.');
      return;
    }

    const prevPriceNum = previousPriceAmount.trim() ? parseFloat(previousPriceAmount.replace(',', '.')) : null;

    setProcessing(true);
    try {
      const repo = new FirestoreProductRepository();
      const useCase = new UpdateProductUseCase(repo);

      // Agrupa a lista de imagens (principal + galeria)
      const imagesList: string[] = [];
      if (mainImageUrl.trim()) {
        imagesList.push(mainImageUrl.trim());
      }
      if (galleryUrls.trim()) {
        const lines = galleryUrls.split('\n').map((l) => l.trim()).filter(Boolean);
        imagesList.push(...lines);
      }

      const changes: Partial<Product> = {
        title: trimmedTitle,
        description: description.trim(),
        brand: brand.trim(),
        categoryId: categoryId.trim() || 'Geral',
        currentPrice: Price.create(priceNum),
        previousPrice: prevPriceNum && !isNaN(prevPriceNum) && prevPriceNum > 0 ? Price.create(prevPriceNum) : null,
        images: imagesList.length > 0 ? imagesList : product.images,
      };

      await useCase.execute({
        productId: product.id,
        userId: user.uid,
        changes,
      });

      console.log('[EditProductModal] Produto atualizado com sucesso. ID:', product.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[EditProductModal] Erro ao atualizar produto:', err);
      const errMsg = err?.message || String(err);
      alert(`Não foi possível salvar as alterações do produto: ${errMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100">Editar Produto (Catálogo)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product ID & Identity Subheader */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-2 flex items-center justify-between text-xs text-slate-400">
          <span>
            ID do Produto: <strong className="font-mono text-blue-400">{product.id}</strong>
          </span>
          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
            Marketplace: {product.marketplaceSlug?.toUpperCase() || 'GERAL'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título do Produto <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Perfume Sauvage Dior Eau de Parfum 100ml"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição Catalográfica
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição detalhada do produto no catálogo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Grid de Marca e Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-blue-400" /> Marca / Fabricante
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Dior, Nike, Samsung"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-blue-400" /> Categoria
              </label>
              <input
                type="text"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                placeholder="Ex: Perfumes Importados"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Grid de Preços */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Preço Atual (R$) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={currentPriceAmount}
                onChange={(e) => setCurrentPriceAmount(e.target.value)}
                placeholder="Ex: 689.90"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Preço Anterior (R$) (Opcional)
              </label>
              <input
                type="text"
                value={previousPriceAmount}
                onChange={(e) => setPreviousPriceAmount(e.target.value)}
                placeholder="Ex: 899.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-slate-500 transition"
              />
            </div>
          </div>

          {/* Imagem Principal & Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5 text-blue-400" /> URL da Imagem Principal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={mainImageUrl}
                onChange={(e) => setMainImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem-principal.jpg"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
              {mainImageUrl.trim() && (
                <div className="h-10 w-10 shrink-0 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <img
                    src={mainImageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Galeria de Imagens Secundárias */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-blue-400" /> Galeria de Imagens Adicionais (Uma URL por linha)
            </label>
            <textarea
              rows={2}
              value={galleryUrls}
              onChange={(e) => setGalleryUrls(e.target.value)}
              placeholder="https://exemplo.com/imagem-2.jpg&#10;https://exemplo.com/imagem-3.jpg"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={processing}
            >
              {processing ? 'Salvando Alterações...' : 'Salvar Produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
