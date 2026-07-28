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
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import {
  AnalyticsEvent,
  AnalyticsEventProps,
  AnalyticsEventSource,
  AnalyticsEventType,
} from '../../../core/domain/entities/analytics-event.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreAnalyticsEventRepository {
  private collectionName = 'analytics_events';

  /**
   * Grava um evento de analytics.
   * Imutável — sem update ou delete permitidos (garantido pelas regras Firestore).
   */
  public async record(props: AnalyticsEventProps): Promise<void> {
    try {
      const event = new AnalyticsEvent(props);
      const ref = doc(db, this.collectionName, event.id);
      await setDoc(ref, {
        id: event.id,
        userId: event.userId,
        tenantId: event.tenantId,
        event: event.event,
        source: event.source,
        campaignId: event.campaignId ?? null,
        offerId: event.offerId ?? null,
        productId: event.productId ?? null,
        metadata: event.metadata,
        timestamp: event.timestamp,
      });
    } catch (err) {
      console.warn('[FirestoreAnalyticsEventRepository] record error:', err);
    }
  }

  /**
   * Busca eventos paginados por usuário — isolamento multi-tenant garantido.
   */
  public async findPagedByUserId(
    userId: string,
    pageSize: number = 50,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<AnalyticsEventProps>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => d.data() as AnalyticsEventProps);
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreAnalyticsEventRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }

  /**
   * Busca eventos por fonte específica — para análise por canal (Instagram, WhatsApp, etc.).
   */
  public async findPagedBySource(
    userId: string,
    source: AnalyticsEventSource,
    pageSize: number = 50,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<AnalyticsEventProps>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        where('source', '==', source),
        orderBy('timestamp', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => d.data() as AnalyticsEventProps);
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreAnalyticsEventRepository] findPagedBySource error:', err);
      return { items: [], hasMore: false };
    }
  }

  /**
   * Busca eventos por campanha — para correlacionar dados externos com campanhas internas.
   * campaignId é opcional em analytics_events, mas quando presente, permite este filtro.
   */
  public async findPagedByCampaignId(
    userId: string,
    campaignId: string,
    pageSize: number = 50,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<AnalyticsEventProps>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        where('campaignId', '==', campaignId),
        orderBy('timestamp', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => d.data() as AnalyticsEventProps);
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreAnalyticsEventRepository] findPagedByCampaignId error:', err);
      return { items: [], hasMore: false };
    }
  }
}
