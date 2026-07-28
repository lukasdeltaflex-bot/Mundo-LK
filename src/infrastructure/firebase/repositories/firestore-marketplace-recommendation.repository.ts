import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
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
  MarketplaceRecommendation,
  MarketplaceRecommendationProps,
  RecommendationStatus,
} from '../../../core/domain/entities/marketplace-recommendation.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreMarketplaceRecommendationRepository {
  private collectionName = 'marketplace_recommendations';

  public async findById(id: string): Promise<MarketplaceRecommendation | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return new MarketplaceRecommendation(snap.data() as MarketplaceRecommendationProps);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreMarketplaceRecommendationRepository] findById error:', err);
      return null;
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 20,
    statusFilter?: RecommendationStatus,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<MarketplaceRecommendation>> {
    try {
      const constraints: any[] = [where('userId', '==', userId)];
      if (statusFilter) {
        constraints.push(where('status', '==', statusFilter));
      }
      constraints.push(orderBy('opportunityScore', 'desc'));
      constraints.push(limit(pageSize));
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new MarketplaceRecommendation(d.data() as MarketplaceRecommendationProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreMarketplaceRecommendationRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }

  public async save(recommendation: MarketplaceRecommendation): Promise<void> {
    const ref = doc(db, this.collectionName, recommendation.id);
    await setDoc(
      ref,
      {
        id: recommendation.id,
        userId: recommendation.userId,
        tenantId: recommendation.tenantId,
        productCategory: recommendation.productCategory,
        keyword: recommendation.keyword,
        marketplaceSlug: recommendation.marketplaceSlug,
        opportunityScore: recommendation.opportunityScore,
        reasons: recommendation.reasons,
        suggestedAction: recommendation.suggestedAction,
        status: recommendation.status,
        createdAt: recommendation.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
