export type RuleStatus = 'ACTIVE' | 'TESTING' | 'PAUSED' | 'ARCHIVED';

export type RuleMetric =
  | 'ctr'
  | 'conversionRate'
  | 'roi'
  | 'clicks'
  | 'shares'
  | 'daysSinceLastClick';

export type RuleOperator = '>' | '<' | '>=' | '<=' | '==';

export type ActionType = 'CREATE_RECOMMENDATION' | 'SEND_ALERT' | 'CREATE_JOB';

export type ActionChannel = 'whatsapp' | 'telegram' | 'email';

export interface RuleTrigger {
  metric: RuleMetric;
  operator: RuleOperator;
  value: number;
}

export interface RuleAction {
  type: ActionType;
  channel?: ActionChannel;
  payload?: Record<string, unknown>;
}

export interface AutomationRuleProps {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  trigger: RuleTrigger;
  action: RuleAction;
  status: RuleStatus;
  cooldownMinutes: number; // e.g. 1440 = 24h
  lastTriggeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * AutomationRule — Entidade de Regras de Automação (Release 2.2.1)
 * Suporta os status ACTIVE, TESTING (dry-run), PAUSED, ARCHIVED e cooldownMinutes contra loops.
 */
export class AutomationRule {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public name: string;
  public trigger: RuleTrigger;
  public action: RuleAction;
  public status: RuleStatus;
  public cooldownMinutes: number;
  public lastTriggeredAt?: string;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: AutomationRuleProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.name = props.name;
    this.trigger = props.trigger;
    this.action = props.action;
    this.status = props.status || 'ACTIVE';
    this.cooldownMinutes = props.cooldownMinutes ?? 1440;
    this.lastTriggeredAt = props.lastTriggeredAt;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  /**
   * Verifica se a regra está dentro do período de cooldown.
   */
  public isInCooldown(now: Date = new Date()): boolean {
    if (!this.lastTriggeredAt) return false;
    const lastTime = new Date(this.lastTriggeredAt).getTime();
    const diffMinutes = (now.getTime() - lastTime) / (1000 * 60);
    return diffMinutes < this.cooldownMinutes;
  }
}
