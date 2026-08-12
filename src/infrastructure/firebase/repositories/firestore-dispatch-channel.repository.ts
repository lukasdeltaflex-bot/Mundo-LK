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
import { DispatchChannel } from '../../../core/domain/entities/dispatch-channel.entity';

export interface FirestoreDispatchChannelDoc {
  id: string;
  userId: string;
  tenantId?: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export class FirestoreDispatchChannelRepository {
  private collectionName = 'dispatch_channels';

  public async findAll(userId: string): Promise<DispatchChannel[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return this.seedDefaultsIfEmpty(userId);
      }
      return snap.docs.map((docSnap) => this.toDomain(docSnap.data() as FirestoreDispatchChannelDoc));
    } catch (err) {
      console.warn('[FirestoreDispatchChannelRepository] findAll error:', err);
      return [];
    }
  }

  public async save(channel: DispatchChannel): Promise<void> {
    const activeUid = auth.currentUser?.uid || (channel.userId && channel.userId !== 'user_default' ? channel.userId : null);
    if (!activeUid) {
      const authErr: any = new Error('[FirestoreDispatchChannelRepository] Usuário não autenticado no Firebase Auth.');
      authErr.code = 'unauthenticated';
      throw authErr;
    }

    if (auth.currentUser) {
      try {
        await auth.currentUser.getIdToken();
      } catch (tErr) {
        console.warn('[FirestoreDispatchChannelRepository] Alerta ao renovar token do usuário:', tErr);
      }
    }

    const raw = this.toPersistence(channel, activeUid);

    console.log('[FirestoreDispatchChannelRepository.save] Gravando Canal no Firestore:', {
      collection: this.collectionName,
      docId: channel.id,
      authUid: activeUid,
      payload: raw,
    });

    try {
      const ref = doc(db, this.collectionName, channel.id);
      await setDoc(ref, raw, { merge: true });
      console.log('[FirestoreDispatchChannelRepository.save] Canal salvo com sucesso:', channel.id);
    } catch (err: any) {
      console.error('[FirestoreDispatchChannelRepository.save] FALHA AO GRAVAR CANAL NO FIRESTORE:', {
        docId: channel.id,
        code: err?.code,
        message: err?.message,
        name: err?.name,
        err,
      });
      throw err;
    }
  }

  public async saveBatch(channels: DispatchChannel[]): Promise<void> {
    if (channels.length === 0) return;
    const activeUid = auth.currentUser?.uid;
    const batch = writeBatch(db);
    for (const item of channels) {
      const raw = this.toPersistence(item, activeUid || item.userId);
      const ref = doc(db, this.collectionName, item.id);
      batch.set(ref, raw, { merge: true });
    }
    try {
      await batch.commit();
    } catch (err: any) {
      console.error('[FirestoreDispatchChannelRepository.saveBatch] FALHA NO BATCH DE CANAIS:', {
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
      console.log('[FirestoreDispatchChannelRepository.delete] Canal removido:', id);
    } catch (err: any) {
      console.error('[FirestoreDispatchChannelRepository.delete] Erro ao remover canal:', {
        docId: id,
        code: err?.code,
        message: err?.message,
        err,
      });
      throw err;
    }
  }

  public async seedDefaultsIfEmpty(userId: string): Promise<DispatchChannel[]> {
    const activeUid = auth.currentUser?.uid || (userId && userId !== 'user_default' ? userId : null);
    if (!activeUid) {
      console.warn('[FirestoreDispatchChannelRepository] Semente de canais ignorada: usuário não autenticado.');
      return [];
    }

    const defaults = [
      'WhatsApp Promoções 01',
      'WhatsApp Achadinhos VIP',
      'Telegram Ofertas Pro',
      'Instagram Feed / Stories',
      'Facebook Grupos',
      'TikTok Shop / Vídeo',
      'Outro Canal',
    ];

    const list: DispatchChannel[] = [];
    for (const name of defaults) {
      const id = `chan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const channel = new DispatchChannel({
        id,
        userId: activeUid,
        name,
        active: true,
      });
      list.push(channel);
    }

    try {
      await this.saveBatch(list);
    } catch (err) {
      console.warn('[FirestoreDispatchChannelRepository] Erro ao semear canais padrão:', err);
    }

    return list;
  }

  private toDomain(doc: FirestoreDispatchChannelDoc): DispatchChannel {
    return new DispatchChannel({
      id: doc.id,
      userId: doc.userId,
      name: doc.name || 'Canal sem nome',
      active: doc.active ?? true,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    });
  }

  private toPersistence(entity: DispatchChannel, explicitUid?: string): FirestoreDispatchChannelDoc {
    const activeUid = auth.currentUser?.uid || explicitUid || entity.userId;
    return {
      id: entity.id,
      userId: activeUid,
      tenantId: activeUid,
      name: entity.name || '',
      active: entity.active ?? true,
      createdAt: (entity.createdAt || new Date()).toISOString(),
      updatedAt: (entity.updatedAt || new Date()).toISOString(),
    };
  }
}
