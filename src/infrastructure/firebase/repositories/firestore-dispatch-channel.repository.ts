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
    const raw = this.toPersistence(channel);
    const ref = doc(db, this.collectionName, channel.id);
    await setDoc(ref, raw, { merge: true });
  }

  public async saveBatch(channels: DispatchChannel[]): Promise<void> {
    if (channels.length === 0) return;
    const batch = writeBatch(db);
    for (const item of channels) {
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

  public async seedDefaultsIfEmpty(userId: string): Promise<DispatchChannel[]> {
    const activeUid = auth.currentUser?.uid || userId || 'user_default';
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

  private toPersistence(entity: DispatchChannel): FirestoreDispatchChannelDoc {
    const activeUid = auth.currentUser?.uid || entity.userId;
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
