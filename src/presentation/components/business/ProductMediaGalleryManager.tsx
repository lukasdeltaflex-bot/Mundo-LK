'use client';

import React, { useState, useRef } from 'react';
import { ProductMedia, MediaType } from '@/core/domain/entities/product.entity';
import { GripVertical, Star, Trash2, Plus, Video, Image as ImageIcon, Upload, Link as LinkIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { FirebaseStorageService } from '@/infrastructure/firebase/storage/firebase-storage.service';

interface ProductMediaGalleryManagerProps {
  media: ProductMedia[];
  onChange: (updatedMedia: ProductMedia[]) => void;
}

export function ProductMediaGalleryManager({
  media,
  onChange,
}: ProductMediaGalleryManagerProps) {
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<MediaType>('image');
  const [loading, setLoading] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggedIndexRef = useRef<number | null>(null);

  const storageService = useRef(new FirebaseStorageService()).current;

  const handleSetPrimary = (id: string) => {
    const updated = media.map((item) => ({
      ...item,
      isPrimary: item.id === id,
    }));
    updated.sort((a, b) => (a.isPrimary ? -1 : b.isPrimary ? 1 : a.order - b.order));
    updated.forEach((m, idx) => (m.order = idx));
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    const filtered = media.filter((item) => item.id !== id);
    if (filtered.length > 0 && !filtered.some((m) => m.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    filtered.forEach((m, idx) => (m.order = idx));
    setFailedImageIds((prev) => prev.filter((fid) => fid !== id));
    onChange(filtered);
  };

  // Upload Local de Arquivo do PC
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const newItems: ProductMedia[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const nextOrder = media.length + newItems.length;
        const isFirst = nextOrder === 0;

        const mediaItem = await storageService.uploadOfferMediaFile(
          file,
          'product_catalog',
          nextOrder,
          isFirst
        );
        newItems.push(mediaItem);
      }

      const updated = [...media, ...newItems];
      if (!updated.some((m) => m.isPrimary) && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      onChange(updated);
    } catch (err: any) {
      console.error('[ProductMediaGalleryManager] Erro no upload local:', err);
      alert(`Falha no upload do arquivo: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Adição de Mídia por Link com Espelhamento para Firebase Storage
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = newUrl.trim();
    if (!rawUrl) return;

    setLoading(true);
    try {
      let finalUrl = rawUrl;
      if (newType === 'image') {
        finalUrl = await storageService.mirrorExternalUrl(rawUrl, 'product_catalog');
      }

      const nextOrder = media.length;
      const isFirst = nextOrder === 0;
      const newItem = storageService.buildUrlMedia(finalUrl, newType, nextOrder, isFirst);

      const updated = [...media, newItem];
      if (!updated.some((m) => m.isPrimary) && updated.length > 0) {
        updated[0].isPrimary = true;
      }

      onChange(updated);
      setNewUrl('');
    } catch (err: any) {
      alert(err?.message || 'Falha ao adicionar a mídia por URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    draggedIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    const fromIdx = draggedIndexRef.current;
    if (fromIdx === null || fromIdx === targetIndex) return;

    const listCopy = [...media];
    const [moved] = listCopy.splice(fromIdx, 1);
    listCopy.splice(targetIndex, 0, moved);

    listCopy.forEach((item, idx) => (item.order = idx));
    onChange(listCopy);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-blue-400" />
          Galeria de Mídia do Produto ({media.length})
        </h4>
        <span className="text-[11px] text-slate-400">
          ☰ Arraste para reorganizar | ⭐ Imagem Principal
        </span>
      </div>

      {/* Botões de Entrada Dupla: Arquivo do PC vs Link URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-xs justify-center"
            leftIcon={loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-purple-400" />}
          >
            📁 Anexar Arquivo do PC
          </Button>
        </div>

        <form onSubmit={handleAddMedia} className="flex items-center gap-1.5">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as MediaType)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="image">📸 Foto</option>
            <option value="video">▶️ Vídeo</option>
          </select>
          <input
            type="text"
            required
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Link HTTPS..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
          />
          <Button type="submit" size="sm" variant="primary" disabled={loading} className="text-xs px-2.5 py-1.5 shrink-0">
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </form>
      </div>

      {/* Media Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {media.map((item, idx) => {
          const displayUrl = FirebaseStorageService.getDisplayUrl(item.url);
          const hasFailed = failedImageIds.includes(item.id);

          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition text-xs group cursor-grab active:cursor-grabbing ${
                item.isPrimary
                  ? 'bg-blue-950/40 border-blue-500/50 shadow-md'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <GripVertical className="h-4 w-4 text-slate-600 group-hover:text-slate-300 shrink-0 cursor-grab" />

                {/* Preview Thumbnail */}
                <div className="relative h-11 w-11 shrink-0 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center">
                  {item.type === 'video' ? (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-purple-400">
                      <Video className="h-5 w-5" />
                    </div>
                  ) : hasFailed ? (
                    <div className="flex flex-col items-center justify-center text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  ) : (
                    <img
                      src={displayUrl}
                      alt={`Mídia ${idx + 1}`}
                      className="h-full w-full object-cover"
                      onError={() => {
                        setFailedImageIds((prev) => [...prev, item.id]);
                      }}
                    />
                  )}
                </div>

                <div className="truncate max-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-200 text-[11px] truncate">
                      #{idx + 1} {item.type === 'video' ? 'Vídeo' : 'Imagem'}
                    </span>
                    {item.isPrimary && (
                      <span className="bg-amber-500/20 text-amber-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                        <Star className="h-2.5 w-2.5 fill-amber-300" /> Principal
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate font-mono">{item.url}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {item.type === 'image' && !item.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(item.id)}
                    title="Definir como imagem principal"
                    className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  title="Remover mídia"
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {media.length === 0 && (
          <p className="col-span-full text-xs text-slate-500 italic text-center py-3">
            Nenhuma mídia cadastrada neste produto.
          </p>
        )}
      </div>
    </div>
  );
}
