import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
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
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
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
      const q = query(collection(db, this.collectionName), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => new IntegrationConnection(d.data() as IntegrationConnectionProps));
    } catch (err) {
      console.warn('[FirestoreMarketplaceConnectionRepository] findAllByUserId error:', err);
      return [];
    }
  }

  public async save(conn: IntegrationConnection): Promise<void> {
    const docId = `conn_${conn.userId}_${conn.marketplaceSlug}`;
    const ref = doc(db, this.collectionName, docId);

    const rawData = {
      id: docId,
      userId: conn.userId,
      tenantId: conn.tenantId,
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
      createdAt: conn.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Aplica sanitização estrita para eliminar qualquer 'undefined'
    const cleanData = this.sanitizeData(rawData);

    await setDoc(ref, cleanData, { merge: true });
  }
}
