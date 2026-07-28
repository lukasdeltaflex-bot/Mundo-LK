import { IDomainEvent } from './DomainEventBus';

export interface AutomationTriggeredPayload extends Record<string, unknown> {
  ruleId: string;
  ruleName: string;
  campaignId: string;
  userId: string;
  actionType: string;
  actionChannel?: string;
  isTesting: boolean;
  triggeredAt: string;
  metricValue: number;
}

export class AutomationTriggeredEvent implements IDomainEvent {
  public readonly eventName = 'AutomationTriggeredEvent';
  public readonly timestamp: string;
  public readonly payload: AutomationTriggeredPayload;

  constructor(payload: AutomationTriggeredPayload) {
    this.timestamp = payload.triggeredAt || new Date().toISOString();
    this.payload = payload;
  }
}

export interface AutomationSkippedPayload extends Record<string, unknown> {
  ruleId: string;
  campaignId: string;
  userId: string;
  reason: 'COOLDOWN_ACTIVE' | 'RULE_PAUSED' | 'THRESHOLD_NOT_MET';
  skippedAt: string;
}

export class AutomationSkippedEvent implements IDomainEvent {
  public readonly eventName = 'AutomationSkippedEvent';
  public readonly timestamp: string;
  public readonly payload: AutomationSkippedPayload;

  constructor(payload: AutomationSkippedPayload) {
    this.timestamp = payload.skippedAt || new Date().toISOString();
    this.payload = payload;
  }
}
