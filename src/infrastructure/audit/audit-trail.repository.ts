import { IAuditTrailRepository } from '../../core/domain/ports/audit/IAuditTrailRepository';
import { AuditLog } from '../../core/domain/entities/audit-log.entity';

export class AuditTrailRepository implements IAuditTrailRepository {
  private static instance: AuditTrailRepository;
  private logs: AuditLog[] = [];

  constructor() {}

  public static getInstance(): AuditTrailRepository {
    if (!AuditTrailRepository.instance) {
      AuditTrailRepository.instance = new AuditTrailRepository();
    }
    return AuditTrailRepository.instance;
  }

  public async record(log: AuditLog): Promise<void> {
    this.logs.push(log);
    console.log(`[AuditTrail] Action: "${log.action}" by User: "${log.userId}" at ${log.timestamp}`);
  }

  public async findByUserId(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.logs
      .filter((log) => log.userId === userId)
      .slice(-limit)
      .reverse();
  }
}
