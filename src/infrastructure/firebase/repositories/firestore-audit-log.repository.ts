import { doc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { AuditLog } from '../../../core/domain/entities/audit-log.entity';

export class FirestoreAuditLogRepository {
  private collectionName = 'system_logs';

  public async save(log: AuditLog): Promise<void> {
    try {
      const ref = doc(db, this.collectionName, log.id);
      await setDoc(ref, {
        id: log.id,
        userId: log.userId,
        tenantId: log.tenantId,
        action: log.action,
        module: log.module,
        entity: log.entity,
        entityId: log.entityId,
        metadata: log.metadata,
        timestamp: log.timestamp,
        ip: log.ip || null,
        userAgent: log.userAgent || null,
      });
    } catch (err) {
      console.warn('[FirestoreAuditLogRepository] Erro ao gravar log de auditoria:', err);
    }
  }

  public async findByUserId(userId: string, pageSize: number = 20): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        limit(pageSize)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => new AuditLog(d.data() as any));
    } catch (err) {
      console.warn('[FirestoreAuditLogRepository] Erro ao buscar logs:', err);
      return [];
    }
  }
}
