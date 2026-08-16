import {
  doc,
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
  order?: number;
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
      const items = snap.docs.map((docSnap) => this.toDomain(docSnap.data() as FirestoreTargetGroupDoc));
      return items.sort((a, b) => a.order - b.order);
    } catch (err) {
      console.warn('[FirestoreTargetGroupRepository] findAll error:', err);
      return [];
    }
  }

  public async save(group: TargetGroup): Promise<void> {
    const activeUid = auth.currentUser?.uid || (group.userId && group.userId !== 'user_default' ? group.userId : null);
    if (!activeUid) {
      const authErr: any = new Error('[FirestoreTargetGroupRepository] Usuário não autenticado no Firebase Auth.');
      authErr.code = 'unauthenticated';
      throw authErr;
    }

    if (auth.currentUser) {
      try {
        await auth.currentUser.getIdToken();
      } catch (tErr) {
        console.warn('[FirestoreTargetGroupRepository] Alerta ao renovar token do usuário:', tErr);
      }
    }

    const raw = this.toPersistence(group, activeUid);

    console.log('[FirestoreTargetGroupRepository.save] Gravando Grupo/Lista no Firestore:', {
      collection: this.collectionName,
      docId: group.id,
      authUid: activeUid,
      payload: raw,
    });

    try {
      const ref = doc(db, this.collectionName, group.id);
      await setDoc(ref, raw, { merge: true });
      console.log('[FirestoreTargetGroupRepository.save] Grupo/Lista salvo no Firestore com sucesso:', group.id);
    } catch (err: any) {
      console.error('[FirestoreTargetGroupRepository.save] FALHA AO GRAVAR GRUPO NO FIRESTORE:', {
        docId: group.id,
        code: err?.code,
        message: err?.message,
        name: err?.name,
        err,
      });
      throw err;
    }
  }

  public async saveBatch(groups: TargetGroup[]): Promise<void> {
    if (groups.length === 0) return;
    const activeUid = auth.currentUser?.uid;
    const batch = writeBatch(db);
    for (const item of groups) {
      const raw = this.toPersistence(item, activeUid || item.userId);
      const ref = doc(db, this.collectionName, item.id);
      batch.set(ref, raw);
    }
    try {
      await batch.commit();
    } catch (err: any) {
      console.error('[FirestoreTargetGroupRepository.saveBatch] FALHA NO BATCH DE GRUPOS:', {
        code: err?.code,
        message: err?.message,
        err,
      });
      throw err;
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      const ref = doc(db, this.collectionName, id);
      await deleteDoc(ref);
      console.log('[FirestoreTargetGroupRepository.delete] Grupo removido:', id);
    } catch (err: any) {
      console.error('[FirestoreTargetGroupRepository.delete] Erro ao remover grupo:', {
        docId: id,
        code: err?.code,
        message: err?.message,
        err,
      });
      throw err;
    }
  }

  public async seedDefaultsIfEmpty(userId: string): Promise<TargetGroup[]> {
    const activeUid = auth.currentUser?.uid || (userId && userId !== 'user_default' ? userId : null);
    if (!activeUid) {
      console.warn('[FirestoreTargetGroupRepository] Semente de grupos ignorada: usuário não autenticado.');
      return [];
    }

    const defaults = [
      { name: 'Grupo VIP #01', description: 'Clientes de alta conversão' },
      { name: 'Canal Geral de Ofertas', description: 'Público amplo' },
      { name: 'Feed Principal', description: 'Divulgação em redes sociais' },
      { name: 'Lista Achadinhos', description: 'Promoções imperdíveis' },
    ];

    const list: TargetGroup[] = [];
    let orderCounter = 0;
    for (const item of defaults) {
      const id = `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const group = new TargetGroup({
        id,
        userId: activeUid,
        name: item.name,
        description: item.description,
        order: orderCounter++,
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
      order: doc.order ?? 0,
      active: doc.active ?? true,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    });
  }

  private toPersistence(entity: TargetGroup, explicitUid?: string): FirestoreTargetGroupDoc {
    const activeUid = auth.currentUser?.uid || explicitUid || entity.userId;
    return {
      id: entity.id,
      userId: activeUid,
      tenantId: activeUid,
      name: entity.name || '',
      description: entity.description || '',
      order: entity.order ?? 0,
      active: entity.active ?? true,
      createdAt: (entity.createdAt || new Date()).toISOString(),
      updatedAt: (entity.updatedAt || new Date()).toISOString(),
    };
  }
}
