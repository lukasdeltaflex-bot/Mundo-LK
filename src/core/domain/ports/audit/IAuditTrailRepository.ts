import { AuditLog } from '../../entities/audit-log.entity';

export interface IAuditTrailRepository {
  record(log: AuditLog): Promise<void>;
  findByUserId(userId: string, limit?: number): Promise<AuditLog[]>;
}
