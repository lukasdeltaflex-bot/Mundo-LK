'use client';

import React, { useState, useRef } from 'react';
import { ProductMedia, MediaType } from '@/core/domain/entities/product.entity';
import { GripVertical, Star, Trash2, Plus, Video, Image as ImageIcon, Check } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';

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
  const draggedIndexRef = useRef<number | null>(null);

  const handleSetPrimary = (id: string) => {
    const updated = media.map((item) => ({
      ...item,
      isPrimary: item.id === id,
    }));
    // Reorder so primary is first (order 0)
    updated.sort((a, b) => (a.isPrimary ? -1 : b.isPrimary ? 1 : a.order - b.order));
    updated.forEach((m, idx) => (m.order = idx));
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    const filtered = media.filter((item) => item.id !== id);
    // If deleted item was primary, assign primary to first item
    if (filtered.length > 0 && !filtered.some((m) => m.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    filtered.forEach((m, idx) => (m.order = idx));
    onChange(filtered);
  };

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    const url = newUrl.trim();
    if (!url) return;

    const newItem: ProductMedia = {
      id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: newType,
      url,
      order: media.length,
      isPrimary: media.length === 0,
    };

    const updated = [...media, newItem];
    onChange(updated);
    setNewUrl('');
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

      {/* Form Add Media */}
      <form onSubmit={handleAddMedia} className="flex flex-wrap items-center gap-2 pt-1">
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as MediaType)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="image">📸 Imagem</option>
          <option value="video">▶️ Vídeo</option>
        </select>
        <input
          type="url"
          required
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder={newType === 'image' ? 'https://exemplo.com/foto.jpg' : 'https://exemplo.com/video.mp4'}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 min-w-[200px]"
        />
        <Button type="submit" size="sm" variant="primary" className="text-xs py-1.5">
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
        </Button>
      </form>

      {/* Media Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {media.map((item, idx) => (
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
              <div className="relative h-11 w-11 shrink-0 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                {item.type === 'video' ? (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-purple-400">
                    <Video className="h-5 w-5" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={`Mídia ${idx + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
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
        ))}

        {media.length === 0 && (
          <p className="col-span-full text-xs text-slate-500 italic text-center py-3">
            Nenhuma mídia cadastrada neste produto.
          </p>
        )}
      </div>
    </div>
  );
}
