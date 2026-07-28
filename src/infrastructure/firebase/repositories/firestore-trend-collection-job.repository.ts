import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  getDocs,
  limit,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import {
  TrendCollectionJob,
  TrendCollectionJobProps,
} from '../../../core/domain/entities/trend-collection-job.entity';

export class FirestoreTrendCollectionJobRepository {
  private collectionName = 'marketplace_trend_jobs';

  public async save(job: TrendCollectionJob): Promise<void> {
    try {
      const ref = doc(db, this.collectionName, job.id);
      await setDoc(ref, {
        id: job.id,
        marketplaceSlug: job.marketplaceSlug,
        status: job.status,
        trendsCollected: job.trendsCollected,
        errorsCount: job.errorsCount,
        errorMessage: job.errorMessage ?? null,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt ?? null,
      });
    } catch (err) {
      console.warn('[FirestoreTrendCollectionJobRepository] save error:', err);
    }
  }

  public async findLatest(limitCount: number = 20): Promise<TrendCollectionJob[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('startedAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => new TrendCollectionJob(d.data() as TrendCollectionJobProps));
    } catch (err) {
      console.warn('[FirestoreTrendCollectionJobRepository] findLatest error:', err);
      return [];
    }
  }
}
