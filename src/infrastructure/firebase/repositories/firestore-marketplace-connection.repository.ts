import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase.config';
import {
  IntegrationConnection,
  IntegrationConnectionProps,
  MarketplaceConnectionSlug,
} from '../../../core/domain/entities/marketplace-connection.entity';

export class FirestoreMarketplaceConnectionRepository {
  private collectionName = 'marketplace_connections';

  /**
   * Sanitizador Estrito — Remove recursivamente campos com valor undefined
   * para evitar o erro "Unsupported field value: undefined" no Firestore setDoc().
   */
  private sanitizeData<T extends Record<string, any>>(obj: T): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = this.sanitizeData(value);
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  }

  public async findByUserIdAndSlug(
    userId: string,
    marketplaceSlug: MarketplaceConnectionSlug
  ): Promise<IntegrationConnection | null> {
    try {
      const activeUid = auth.currentUser?.uid || userId;
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', activeUid),
        where('marketplaceSlug', '==', marketplaceSlug)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return new IntegrationConnection(snap.docs[0].data() as IntegrationConnectionProps);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreMarketplaceConnectionRepository] findByUserIdAndSlug error:', err);
      return null;
    }
  }

  public async findAllByUserId(userId: string): Promise<IntegrationConnection[]> {
    try {
      const activeUid = auth.currentUser?.uid || userId;
      const q = query(collection(db, this.collectionName), where('userId', '==', activeUid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => new IntegrationConnection(d.data() as IntegrationConnectionProps));
    } catch (err) {
      console.warn('[FirestoreMarketplaceConnectionRepository] findAllByUserId error:', err);
      return [];
    }
  }

  public async save(conn: IntegrationConnection): Promise<void> {
    const activeUid = auth.currentUser?.uid || conn.userId;
    const docId = `conn_${activeUid}_${conn.marketplaceSlug}`;
    const ref = doc(db, this.collectionName, docId);

    const rawData = {
      id: docId,
      userId: activeUid,
      tenantId: activeUid,
      marketplaceSlug: conn.marketplaceSlug,
      name: conn.name,
      category: conn.category,
      credentials: conn.credentials,
      status: conn.status,
      capabilities: conn.capabilities || [],
      schemaVersion: conn.schemaVersion || 1,
      healthScore: conn.healthScore ?? 100,
      lastTestedAt: conn.lastTestedAt ?? null,
      lastSyncAt: conn.lastSyncAt ?? null,
      lastError: conn.lastError ?? null,
      createdAt: conn.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Aplica sanitização estrita para eliminar qualquer 'undefined'
    const cleanData = this.sanitizeData(rawData);

    console.log('[FirestoreMarketplaceConnectionRepository] Diagnostics Audit:', {
      authUid: auth.currentUser?.uid,
      targetDocId: docId,
      payloadUserId: cleanData.userId,
      payloadTenantId: cleanData.tenantId,
      marketplaceSlug: cleanData.marketplaceSlug,
    });

    await setDoc(ref, cleanData, { merge: true });
  }
}
