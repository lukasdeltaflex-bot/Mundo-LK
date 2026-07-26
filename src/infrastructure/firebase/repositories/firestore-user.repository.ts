import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { User } from '../../../core/domain/entities/user.entity';

export interface FirestoreUserDoc {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  phone?: string;
  jobTitle?: string;
  companyName?: string;
  companyCnpj?: string;
  bio?: string;
  role: 'ADMIN' | 'AFFILIATE';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  notifications?: {
    emailAlerts: boolean;
    whatsAppAlerts: boolean;
    soundEffects: boolean;
    highDiscountAlerts: boolean;
  };
}

export class FirestoreUserRepository {
  private collectionName = 'users';
  private memoryStore: Map<string, FirestoreUserDoc> = new Map();

  public async findByUid(uid: string): Promise<User | null> {
    try {
      const ref = doc(db, this.collectionName, uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data() as FirestoreUserDoc;
        return this.toDomain(d);
      }
    } catch {
      const mem = this.memoryStore.get(uid);
      if (mem) return this.toDomain(mem);
    }
    return null;
  }

  public async findDocByUid(uid: string): Promise<FirestoreUserDoc | null> {
    try {
      const ref = doc(db, this.collectionName, uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as FirestoreUserDoc;
      }
    } catch {
      const mem = this.memoryStore.get(uid);
      if (mem) return mem;
    }
    return null;
  }

  public async save(user: User): Promise<void> {
    const raw: FirestoreUserDoc = {
      uid: user.uid,
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin.toISOString(),
    };

    this.memoryStore.set(user.uid, raw);

    try {
      const ref = doc(db, this.collectionName, user.uid);
      await setDoc(ref, raw, { merge: true });
    } catch (error) {
      console.warn('[FirestoreUserRepository] Memory fallback used:', error);
    }
  }

  public async saveDoc(data: Partial<FirestoreUserDoc> & { uid: string }): Promise<void> {
    const existing = this.memoryStore.get(data.uid) || {
      uid: data.uid,
      name: data.name || 'Usuário Afiliado',
      email: data.email || 'usuario@mundolk.com',
      role: 'AFFILIATE',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    const updated: FirestoreUserDoc = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(data.uid, updated);

    try {
      const ref = doc(db, this.collectionName, data.uid);
      await setDoc(ref, updated, { merge: true });
    } catch (error) {
      console.warn('[FirestoreUserRepository] Memory fallback used:', error);
    }
  }

  private toDomain(d: FirestoreUserDoc): User {
    return new User({
      uid: d.uid,
      name: d.name,
      email: d.email,
      photoURL: d.photoURL,
      role: d.role,
      status: d.status,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
      lastLogin: new Date(d.lastLogin),
    });
  }
}
