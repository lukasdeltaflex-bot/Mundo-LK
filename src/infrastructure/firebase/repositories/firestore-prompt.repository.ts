import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { IPromptRepository } from '../../../core/domain/ports/repositories/IPromptRepository';
import { PromptTemplate } from '../../../core/domain/entities/prompt-template.entity';
import { PromptMapper, FirestorePromptDoc } from '../mappers/prompt.mapper';

export class FirestorePromptRepository implements IPromptRepository {
  private collectionName = 'prompts';
  private memoryStore: Map<string, FirestorePromptDoc> = new Map();

  public async findById(id: string): Promise<PromptTemplate | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return PromptMapper.toDomain(snap.data() as FirestorePromptDoc);
      }
    } catch {
      const mem = this.memoryStore.get(id);
      if (mem) return PromptMapper.toDomain(mem);
    }
    return null;
  }

  public async findByNameAndVersion(name: string, version: string): Promise<PromptTemplate | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('name', '==', name),
        where('version', '==', version)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return PromptMapper.toDomain(snap.docs[0].data() as FirestorePromptDoc);
      }
    } catch {
      for (const item of this.memoryStore.values()) {
        if (item.name === name && item.version === version) return PromptMapper.toDomain(item);
      }
    }
    return null;
  }

  public async findAllActive(): Promise<PromptTemplate[]> {
    try {
      const q = query(collection(db, this.collectionName), where('status', '==', 'ACTIVE'));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => PromptMapper.toDomain(docSnap.data() as FirestorePromptDoc));
    } catch {
      const results: PromptTemplate[] = [];
      for (const item of this.memoryStore.values()) {
        if (item.status === 'ACTIVE') results.push(PromptMapper.toDomain(item));
      }
      return results;
    }
  }

  public async save(prompt: PromptTemplate): Promise<void> {
    const raw = PromptMapper.toPersistence(prompt);
    this.memoryStore.set(prompt.id, raw);
    try {
      const ref = doc(db, this.collectionName, prompt.id);
      await setDoc(ref, raw, { merge: true });
    } catch (error) {
      console.warn('[FirestorePromptRepository] Persisted to memory fallback:', error);
    }
  }
}
