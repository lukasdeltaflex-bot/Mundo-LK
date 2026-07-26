import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { User, UserProps } from '../../../core/domain/entities/user.entity';

export interface FirestoreUserDoc {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
  role: 'ADMIN' | 'AFFILIATE';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
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
    } catch {
      const mem = this.memoryStore.get(uid);
      if (mem) {
        return new User({
          uid: mem.uid,
          name: mem.name,
          email: mem.email,
          photoURL: mem.photoURL,
          role: mem.role,
          status: mem.status,
          createdAt: new Date(mem.createdAt),
          updatedAt: new Date(mem.updatedAt),
          lastLogin: new Date(mem.lastLogin),
        });
      }
    }
    return null;
  }

  public async save(user: User): Promise<void> {
    const docData: FirestoreUserDoc = {
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

    this.memoryStore.set(user.uid, docData);

    try {
      const ref = doc(db, this.collectionName, user.uid);
      await setDoc(ref, docData, { merge: true });
    } catch (error) {
      console.warn('[FirestoreUserRepository] Fallback to memory due to network/config:', error);
    }
  }
}
