export type ExecutionResult = 'SUCCESS' | 'FAILED' | 'SKIPPED';

export interface AutomationExecutionProps {
  id: string;
  userId: string;
  tenantId: string;
  ruleId: string;
  jobId?: string;
  campaignId: string;
  result: ExecutionResult;
  startedAt: string;
  finishedAt?: string;
  error?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * AutomationExecution — Entidade de Histórico Operacional de Automações (Release 2.2.1)
 * Registra cada execução de regra de automação para rastreabilidade de negócio.
 */
export class AutomationExecution {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly ruleId: string;
  public readonly jobId?: string;
  public readonly campaignId: string;
  public readonly result: ExecutionResult;
  public readonly startedAt: string;
  public readonly finishedAt?: string;
  public readonly error?: string | null;
  public readonly metadata?: Record<string, unknown>;

  constructor(props: AutomationExecutionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.ruleId = props.ruleId;
    this.jobId = props.jobId;
    this.campaignId = props.campaignId;
    this.result = props.result;
    this.startedAt = props.startedAt || new Date().toISOString();
    this.finishedAt = props.finishedAt;
    this.error = props.error || null;
    this.metadata = props.metadata || {};
  }
}
