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
  OfferGeneratedContent,
  OfferGeneratedContentProps,
} from '../../../core/domain/entities/offer-generated-content.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreOfferGeneratedContentRepository {
  private collectionName = 'offer_generated_contents';

  public async save(content: OfferGeneratedContent): Promise<void> {
    try {
      const ref = doc(db, this.collectionName, content.id);
      await setDoc(ref, {
        id: content.id,
        offerId: content.offerId,
        userId: content.userId,
        tenantId: content.tenantId,
        style: content.style,
        provider: content.provider,
        model: content.model,
        temperature: content.temperature,
        systemPromptVersion: content.systemPromptVersion,
        userPromptVersion: content.userPromptVersion,
        generatedText: content.generatedText,
        affiliateUrl: content.affiliateUrl,
        createdAt: content.createdAt,
      });
    } catch (err) {
      console.warn('[FirestoreOfferGeneratedContentRepository] save error:', err);
    }
  }

  public async findByOfferId(offerId: string): Promise<OfferGeneratedContent[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('offerId', '==', offerId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => new OfferGeneratedContent(d.data() as OfferGeneratedContentProps));
    } catch (err) {
      console.warn('[FirestoreOfferGeneratedContentRepository] findByOfferId error:', err);
      return [];
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 50,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<OfferGeneratedContent>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new OfferGeneratedContent(d.data() as OfferGeneratedContentProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreOfferGeneratedContentRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }
}
