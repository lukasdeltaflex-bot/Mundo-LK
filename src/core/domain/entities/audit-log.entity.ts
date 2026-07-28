export interface AuditLogProps {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  module: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export class AuditLog {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly action: string;
  public readonly module: string;
  public readonly entity: string;
  public readonly entityId: string;
  public readonly metadata: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly ip?: string;
  public readonly userAgent?: string;

  constructor(props: AuditLogProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.action = props.action;
    this.module = props.module;
    this.entity = props.entity;
    this.entityId = props.entityId;
    this.metadata = props.metadata || {};
    this.timestamp = props.timestamp || new Date().toISOString();
    this.ip = props.ip;
    this.userAgent = props.userAgent;
  }
}
