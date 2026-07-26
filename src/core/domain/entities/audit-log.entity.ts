export interface AuditLogProps {
  id: string;
  userId: string;
  action: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ip?: string;
  origin?: string;
  createdAt: Date;
}

export class AuditLog {
  public readonly id: string;
  public readonly userId: string;
  public readonly action: string;
  public readonly previousValue?: Record<string, unknown> | null;
  public readonly newValue?: Record<string, unknown> | null;
  public readonly ip?: string;
  public readonly origin?: string;
  public readonly createdAt: Date;

  constructor(props: AuditLogProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.action = props.action;
    this.previousValue = props.previousValue;
    this.newValue = props.newValue;
    this.ip = props.ip;
    this.origin = props.origin;
    this.createdAt = props.createdAt;
  }
}
