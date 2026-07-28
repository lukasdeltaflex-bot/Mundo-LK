import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Campaign, CampaignStatus } from '../../../core/domain/entities/campaign.entity';
import { CampaignMetrics } from '../../../core/domain/value-objects/CampaignMetrics';
import { CampaignFinancial } from '../../../core/domain/value-objects/CampaignFinancial';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export interface FirestoreCampaignDoc {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  offerId: string;
  productId: string;
  marketplaceSlug: string;
  status: CampaignStatus;
  metrics: {
    views: number;
    clicks: number;
    shares: number;
    conversions: number;
  };
  financial: {
    revenue: number;
    commission: number;
    cost: number;
  };
  createdAt: string;
  updatedAt: string;
}

export class FirestoreCampaignRepository {
  private collectionName = 'campaigns';

  public async findById(id: string): Promise<Campaign | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return this.toDomain(snap.data() as FirestoreCampaignDoc);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreCampaignRepository] findById error:', err);
      return null;
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 20,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<Campaign>> {
    try {
      const constraints: any[] = [where('userId', '==', userId), limit(pageSize)];
      if (lastDocSnap) {
        constraints.push(startAfter(lastDocSnap));
      }
      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((docSnap) => this.toDomain(docSnap.data() as FirestoreCampaignDoc));
      const newLastSnap = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return {
        items,
        cursor: newLastSnap,
        hasMore: snap.docs.length === pageSize,
      };
    } catch (err) {
      console.warn('[FirestoreCampaignRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }

  public async save(campaign: Campaign): Promise<void> {
    const raw: FirestoreCampaignDoc = {
      id: campaign.id,
      userId: campaign.userId,
      tenantId: campaign.tenantId,
      name: campaign.name,
      offerId: campaign.offerId,
      productId: campaign.productId,
      marketplaceSlug: campaign.marketplaceSlug,
      status: campaign.status,
      metrics: {
        views: campaign.metrics.views,
        clicks: campaign.metrics.clicks,
        shares: campaign.metrics.shares,
        conversions: campaign.metrics.conversions,
      },
      financial: {
        revenue: campaign.financial.revenue,
        commission: campaign.financial.commission,
        cost: campaign.financial.cost,
      },
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = doc(db, this.collectionName, campaign.id);
    await setDoc(ref, raw, { merge: true });
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);
  }

  private toDomain(doc: FirestoreCampaignDoc): Campaign {
    return new Campaign({
      id: doc.id,
      userId: doc.userId,
      tenantId: doc.tenantId,
      name: doc.name,
      offerId: doc.offerId,
      productId: doc.productId,
      marketplaceSlug: doc.marketplaceSlug,
      status: doc.status,
      metrics: CampaignMetrics.create(doc.metrics),
      financial: CampaignFinancial.create(doc.financial),
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }
}
