import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase.config';
import { ProductMedia, MediaType } from '@/core/domain/entities/product.entity';

export class FirebaseStorageService {
  /**
   * Uploads an offer media file (image or video) to Firebase Storage safely with 15s safety timeout.
   * Path: offers/{offerId}/media/{timestamp}_{filename}
   */
  public async uploadOfferMediaFile(
    file: File,
    offerId: string,
    order: number = 0,
    isPrimary: boolean = false
  ): Promise<ProductMedia> {
    if (!file) throw new Error('Nenhum arquivo enviado para upload.');

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      throw new Error('O arquivo selecionado deve ser uma imagem (PNG, JPG, WEBP) ou vídeo (MP4, WEBM).');
    }

    const mediaType: MediaType = isVideo ? 'video' : 'image';
    const MAX_SIZE = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB video, 10MB image

    if (file.size > MAX_SIZE) {
      throw new Error(`O arquivo deve ter no máximo ${isVideo ? '50MB' : '10MB'}.`);
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `offers/${offerId}/media/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);

    // Timeout de Segurança (45s imagem, 120s vídeo) para evitar travamento em redes lentas
    const timeoutMs = isVideo ? 120000 : 45000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`STORAGE_TIMEOUT`)),
        timeoutMs
      )
    );

    try {
      const snapshot = await Promise.race([
        uploadBytes(storageRef, file, { contentType: file.type }),
        timeoutPromise,
      ]);

      const downloadUrl = await getDownloadURL(snapshot.ref);

      return {
        id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: mediaType,
        url: downloadUrl,
        order,
        isPrimary,
        title: file.name,
      };
    } catch (err: any) {
      console.error('[FirebaseStorageService] Erro no upload para o Storage:', err?.message || err);

      const msg = err?.message || String(err);
      if (msg.includes('STORAGE_TIMEOUT')) {
        throw new Error('O upload da imagem expirou (conexão lenta). Tente uma imagem menor ou conexões mais estáveis.');
      } else if (msg.includes('storage/unauthorized')) {
        throw new Error('Permissão negada no Firebase Storage. Verifique suas regras ou autenticação.');
      } else if (msg.includes('storage/canceled')) {
        throw new Error('Upload cancelado.');
      }
      throw new Error(`Falha no upload do arquivo para o Storage: ${msg}`);
    }
  }

  /**
   * Validates and constructs a ProductMedia object from a raw URL link (image or video).
   */
  public buildUrlMedia(
    rawUrl: string,
    mediaType: MediaType,
    order: number = 0,
    isPrimary: boolean = false
  ): ProductMedia {
    const url = (rawUrl || '').trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('A URL informada deve começar com http:// ou https://');
    }

    return {
      id: `urlmed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: mediaType,
      url,
      order,
      isPrimary,
      title: `${mediaType === 'video' ? 'Vídeo' : 'Imagem'} por Link`,
    };
  }

  /**
   * Mirrors an external image URL (Shopee, Amazon, SHEIN, Magalu) to Firebase Storage permanently.
   * Calls /api/mirror-image endpoint. If the URL is already in Firebase Storage, returns it as is.
   */
  public async mirrorExternalUrl(rawUrl: string, offerId?: string): Promise<string> {
    const url = (rawUrl || '').trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('A URL informada deve começar com http:// ou https://');
    }

    if (url.includes('firebasestorage.googleapis.com')) {
      return url;
    }

    try {
      const res = await fetch('/api/mirror-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, offerId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Falha ao espelhar a imagem externa no Firebase Storage.');
      }

      return data.url;
    } catch (err: any) {
      console.warn('[FirebaseStorageService] Espelhamento de URL externa falhou, utilizando URL direta com proxy:', err?.message || err);
      return url;
    }
  }

  /**
   * Returns a safe display URL for rendering in <img> tags.
   * If rawUrl is an external CDN image (Shopee, Amazon, SHEIN, Magalu), routes it through /api/proxy-image
   * to bypass browser hotlinking and CORS blocks completely.
   */
  public static getDisplayUrl(rawUrl: string): string {
    if (!rawUrl) return '';
    const url = rawUrl.trim();
    if (
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.includes('firebasestorage.googleapis.com') ||
      url.startsWith('/api/proxy-image')
    ) {
      return url;
    }
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }

  /**
   * Uploads an offer image file to Firebase Storage safely.
   * Path: offers/{offerId}/{timestamp}_{filename}
   */
  public async uploadOfferImage(file: File, offerId: string): Promise<string> {
    if (!file) throw new Error('Nenhum arquivo enviado para upload.');

    // Validação de tipo de imagem
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo selecionado deve ser uma imagem válida (PNG, JPG, WEBP).');
    }

    // Validação de tamanho máximo (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('A imagem deve ter no máximo 10MB.');
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `offers/${offerId}/${Date.now()}_${sanitizedName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  }

  /**
   * Deletes a previously stored image/media from Firebase Storage safely.
   */
  public async deleteStorageImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
      return; // Não tenta deletar imagens externas
    }

    try {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      console.log('[FirebaseStorageService] Imagem anterior removida do Storage:', imageUrl);
    } catch (err) {
      console.warn('[FirebaseStorageService] Não foi possível remover a imagem antiga do Storage:', err);
    }
  }
}
