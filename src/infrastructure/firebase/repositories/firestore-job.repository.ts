import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Job, JobProps } from '../../../core/domain/entities/job.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreJobRepository {
  private collectionName = 'jobs';

  public async findById(id: string): Promise<Job | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return new Job(snap.data() as JobProps);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreJobRepository] findById error:', err);
      return null;
    }
  }

  /**
   * Verifica se já existe um job com a mesma executionKey para evitar duplicatas (Idempotência).
   */
  public async findByExecutionKey(userId: string, executionKey: string): Promise<Job | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('executionKey', '==', executionKey),
        limit(1)
      );
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const fetchTask = getDocs(q).then((snap) => (snap.docs.length > 0 ? new Job(snap.docs[0].data() as JobProps) : null));
      return await Promise.race([fetchTask, timeout]);
    } catch (err) {
      console.warn('[FirestoreJobRepository] findByExecutionKey error:', err);
      return null;
    }
  }

  /**
   * Busca jobs pendentes para o worker processar (máximo 10 por lote).
   */
  public async findPendingByUserId(userId: string, limitCount: number = 10): Promise<Job[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', '==', 'PENDING'),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => new Job(d.data() as JobProps));
    } catch (err) {
      console.warn('[FirestoreJobRepository] findPendingByUserId error:', err);
      return [];
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 20,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<Job>> {
    try {
      const constraints: any[] = [where('userId', '==', userId), limit(pageSize)];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new Job(d.data() as JobProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreJobRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }

  public async save(job: Job): Promise<void> {
    try {
      const ref = doc(db, this.collectionName, job.id);
      const setTask = setDoc(
        ref,
        {
          id: job.id,
          userId: job.userId,
          tenantId: job.tenantId,
          type: job.type,
          executionKey: job.executionKey,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          status: job.status,
          payload: job.payload,
          result: job.result ?? null,
          errorMessage: job.errorMessage ?? null,
          createdAt: job.createdAt,
          processedAt: job.processedAt ?? null,
        },
        { merge: true }
      );
      const timeout = new Promise<void>((resolve) => setTimeout(() => resolve(), 1500));
      await Promise.race([setTask, timeout]);
    } catch (err) {
      console.warn('[FirestoreJobRepository] save error (executando em fallback seguro):', err);
    }
  }
}
