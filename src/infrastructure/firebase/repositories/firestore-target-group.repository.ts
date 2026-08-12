import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase.config';
import { TargetGroup } from '../../../core/domain/entities/target-group.entity';

export interface FirestoreTargetGroupDoc {
  id: string;
  userId: string;
  tenantId?: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export class FirestoreTargetGroupRepository {
  private collectionName = 'target_groups';

  public async findAll(userId: string): Promise<TargetGroup[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return this.seedDefaultsIfEmpty(userId);
      }
      return snap.docs.map((docSnap) => this.toDomain(docSnap.data() as FirestoreTargetGroupDoc));
    } catch (err) {
      console.warn('[FirestoreTargetGroupRepository] findAll error:', err);
      return [];
    }
  }

  public async save(group: TargetGroup): Promise<void> {
    const raw = this.toPersistence(group);
    const ref = doc(db, this.collectionName, group.id);
    await setDoc(ref, raw, { merge: true });
  }

  public async saveBatch(groups: TargetGroup[]): Promise<void> {
    if (groups.length === 0) return;
    const batch = writeBatch(db);
    for (const item of groups) {
      const raw = this.toPersistence(item);
      const ref = doc(db, this.collectionName, item.id);
      batch.set(ref, raw, { merge: true });
    }
    await batch.commit();
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);
  }

  public async seedDefaultsIfEmpty(userId: string): Promise<TargetGroup[]> {
    const activeUid = auth.currentUser?.uid || userId || 'user_default';
    const defaults = [
      { name: 'Grupo VIP #01', description: 'Clientes de alta conversão' },
      { name: 'Canal Geral de Ofertas', description: 'Público amplo' },
      { name: 'Feed Principal', description: 'Divulgação em redes sociais' },
      { name: 'Lista Achadinhos', description: 'Promoções imperdíveis' },
    ];

    const list: TargetGroup[] = [];
    for (const item of defaults) {
      const id = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const group = new TargetGroup({
        id,
        userId: activeUid,
        name: item.name,
        description: item.description,
        active: true,
      });
      list.push(group);
    }

    try {
      await this.saveBatch(list);
    } catch (err) {
      console.warn('[FirestoreTargetGroupRepository] Erro ao semear grupos padrão:', err);
    }

    return list;
  }

  private toDomain(doc: FirestoreTargetGroupDoc): TargetGroup {
    return new TargetGroup({
      id: doc.id,
      userId: doc.userId,
      name: doc.name || 'Grupo sem nome',
      description: doc.description || '',
      active: doc.active ?? true,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    });
  }

  private toPersistence(entity: TargetGroup): FirestoreTargetGroupDoc {
    const activeUid = auth.currentUser?.uid || entity.userId;
    return {
      id: entity.id,
      userId: activeUid,
      tenantId: activeUid,
      name: entity.name || '',
      description: entity.description || '',
      active: entity.active ?? true,
      createdAt: (entity.createdAt || new Date()).toISOString(),
      updatedAt: (entity.updatedAt || new Date()).toISOString(),
    };
  }
}
