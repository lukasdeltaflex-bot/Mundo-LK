export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type JobType =
  | 'GENERATE_SOCIAL_POST'
  | 'SEND_WHATSAPP'
  | 'EVALUATE_AUTOMATION_RULES'
  | 'OPTIMIZE_CAMPAIGN'
  | 'PUBLISH_MARKETPLACE_LISTING'
  | 'SYNC_MARKETPLACE_LISTING';

export interface JobProps {
  id: string;
  userId: string;
  tenantId: string;
  type: JobType;
  executionKey: string; // Chave de idempotência (ex: "campaign_123_SEND_WA_20260728")
  attempts: number;
  maxAttempts: number; // Padrão: 3
  status: JobStatus;
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
  errorMessage?: string | null;
  createdAt?: string;
  processedAt?: string | null;
}

/**
 * Job — Entidade de Trabalho Assíncrono (Release 2.2.2)
 * Garante idempotência via executionKey e retry controlado via attempts / maxAttempts.
 */
export class Job {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly type: JobType;
  public readonly executionKey: string;
  public attempts: number;
  public readonly maxAttempts: number;
  public status: JobStatus;
  public readonly payload: Record<string, unknown>;
  public result?: Record<string, unknown>;
  public errorMessage?: string | null;
  public readonly createdAt: string;
  public processedAt?: string | null;

  constructor(props: JobProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.type = props.type;
    this.executionKey = props.executionKey;
    this.attempts = props.attempts || 0;
    this.maxAttempts = props.maxAttempts || 3;
    this.status = props.status || 'PENDING';
    this.payload = props.payload || {};
    this.result = props.result;
    this.errorMessage = props.errorMessage || null;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.processedAt = props.processedAt || null;
  }
}
