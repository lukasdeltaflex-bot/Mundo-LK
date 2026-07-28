import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

// ── Tipo do evento bruto gravado na coleção campaign_events ──────────────────
export type CampaignEventType = 'VIEW' | 'CLICK' | 'SHARE' | 'CONVERSION';

export interface CampaignEventDoc {
  id: string;
  campaignId: string;
  userId: string;
  type: CampaignEventType;
  source?: string;   // canal de origem (ex: 'whatsapp', 'telegram')
  marketplaceSlug?: string;
  revenue?: number;
  commission?: number;
  createdAt: string;
}

export class FirestoreCampaignEventRepository {
  private collectionName = 'campaign_events';

  public async record(event: CampaignEventDoc): Promise<void> {
    try {
      const ref = doc(db, this.collectionName, event.id);
      await setDoc(ref, event);
    } catch (err) {
      console.warn('[FirestoreCampaignEventRepository] record error:', err);
    }
  }

  public async findPagedByCampaignId(
    campaignId: string,
    userId: string,
    pageSize: number = 50,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<CampaignEventDoc>> {
    try {
      const constraints: any[] = [
        where('campaignId', '==', campaignId),
        where('userId', '==', userId),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => d.data() as CampaignEventDoc);
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreCampaignEventRepository] findPagedByCampaignId error:', err);
      return { items: [], hasMore: false };
    }
  }
}
