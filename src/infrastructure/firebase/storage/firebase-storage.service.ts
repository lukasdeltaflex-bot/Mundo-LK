import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase.config';

export class FirebaseStorageService {
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
   * Deletes a previously stored image from Firebase Storage safely.
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
