import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { IExtractionCacheRepository, ExtractionCacheDoc } from '../../../core/domain/ports/repositories/IExtractionCacheRepository';

export class FirestoreExtractionCacheRepository implements IExtractionCacheRepository {
  private collectionName = 'extraction_cache';

  public async findByUrl(normalizedUrl: string): Promise<ExtractionCacheDoc | null> {
    const start = Date.now();
    try {
      const q = query(collection(db, this.collectionName), where('normalizedUrl', '==', normalizedUrl));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const docData = snap.docs[0].data() as ExtractionCacheDoc;
        const now = new Date();
        const expiresAt = new Date(docData.expiresAt);

        if (now > expiresAt) {
          // Cache expirado
          console.log(`[Cache] 🗑️ Documento expirado para ${normalizedUrl}`);
          await deleteDoc(snap.docs[0].ref);
          return null;
        }

        console.log(`[Cache] ⚡ Hit de cache em ${Date.now() - start}ms: ${normalizedUrl}`);
        return docData;
      }
      
      console.log(`[Cache] ❌ Miss de cache em ${Date.now() - start}ms: ${normalizedUrl}`);
      return null;
    } catch (error) {
      console.warn(`[Cache] Erro ao buscar cache:`, error);
      return null;
    }
  }

  public async save(docData: ExtractionCacheDoc): Promise<void> {
    try {
      const ref = doc(db, this.collectionName, docData.id);
      await setDoc(ref, docData, { merge: true });
      console.log(`[Cache] ✅ Documento salvo: ${docData.normalizedUrl}`);
    } catch (error) {
      console.error('[Cache] Falha ao salvar no cache:', error);
    }
  }

  public async clearExpired(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const q = query(collection(db, this.collectionName), where('expiresAt', '<', now));
      const snap = await getDocs(q);
      
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref);
      }
      console.log(`[Cache] Limpeza concluída: ${snap.size} documentos expirados removidos.`);
    } catch (error) {
      console.error('[Cache] Erro ao limpar cache expirado:', error);
    }
  }
}
