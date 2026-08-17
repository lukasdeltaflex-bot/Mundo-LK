import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase.config';
import { ProductMedia, MediaType } from '@/core/domain/entities/product.entity';

export class FirebaseStorageService {
  /**
   * Uploads an offer media file (image or video) to Firebase Storage safely.
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

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: mediaType,
      url: downloadUrl,
      order,
      isPrimary,
      title: file.name,
    };
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
