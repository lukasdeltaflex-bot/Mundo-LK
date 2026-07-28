import { v4 as uuidv4 } from 'uuid';
import { AutomationRule, RuleOperator } from '../../domain/entities/automation-rule.entity';
import { Campaign } from '../../domain/entities/campaign.entity';
import { FirestoreAutomationRuleRepository } from '../../../infrastructure/firebase/repositories/firestore-automation-rule.repository';
import { FirestoreAutomationExecutionRepository } from '../../../infrastructure/firebase/repositories/firestore-automation-execution.repository';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { AutomationTriggeredEvent, AutomationSkippedEvent } from '../../domain/events/AutomationEvents';
import { AuditLogService } from './AuditLogService';

export class AutomationRuleEngine {
  private static instance: AutomationRuleEngine;
  private ruleRepo = new FirestoreAutomationRuleRepository();
  private execRepo = new FirestoreAutomationExecutionRepository();

  private constructor() {}

  public static getInstance(): AutomationRuleEngine {
    if (!AutomationRuleEngine.instance) {
      AutomationRuleEngine.instance = new AutomationRuleEngine();
    }
    return AutomationRuleEngine.instance;
  }

  /**
   * Avalia todas as regras ativas/testing do usuário contra as campanhas fornecidas.
   */
  public async evaluateUserRules(userId: string, campaigns: Campaign[]): Promise<void> {
    try {
      const rules = await this.ruleRepo.findActiveByUserId(userId);
      if (rules.length === 0 || campaigns.length === 0) return;

      for (const rule of rules) {
        for (const campaign of campaigns) {
          await this.evaluateOne(rule, campaign);
        }
      }
    } catch (err) {
      console.warn('[AutomationRuleEngine] evaluateUserRules error:', err);
    }
  }

  /**
   * Avalia uma única regra contra uma única campanha.
   */
  public async evaluateOne(rule: AutomationRule, campaign: Campaign): Promise<boolean> {
    const metricValue = this.extractMetricValue(rule.trigger.metric, campaign);
    const isMet = this.compareValues(metricValue, rule.trigger.operator, rule.trigger.value);

    if (!isMet) {
      return false;
    }

    const now = new Date();

    // Checagem de Cooldown
    if (rule.isInCooldown(now)) {
      await this.execRepo.record({
        id: `exec_${uuidv4()}`,
        userId: rule.userId,
        tenantId: rule.tenantId,
        ruleId: rule.id,
        campaignId: campaign.id,
        result: 'SKIPPED',
        startedAt: now.toISOString(),
        error: 'COOLDOWN_ACTIVE',
        metadata: { metricValue, trigger: rule.trigger },
      });

      DomainEventBus.getInstance().publish(
        new AutomationSkippedEvent({
          ruleId: rule.id,
          campaignId: campaign.id,
          userId: rule.userId,
          reason: 'COOLDOWN_ACTIVE',
          skippedAt: now.toISOString(),
        })
      );

      return false;
    }

    const isTesting = rule.status === 'TESTING';

    // Se a regra estiver ATIVA (e não em teste), atualizamos a data de último disparo
    if (!isTesting) {
      rule.lastTriggeredAt = now.toISOString();
      await this.ruleRepo.save(rule);
    }

    // Registra Histórico de Execução (AutomationExecution)
    const execId = `exec_${uuidv4()}`;
    await this.execRepo.record({
      id: execId,
      userId: rule.userId,
      tenantId: rule.tenantId,
      ruleId: rule.id,
      campaignId: campaign.id,
      result: 'SUCCESS',
      startedAt: now.toISOString(),
      finishedAt: now.toISOString(),
      metadata: {
        metricValue,
        trigger: rule.trigger,
        action: rule.action,
        isTesting,
      },
    });

    // Publica Evento no DomainEventBus
    DomainEventBus.getInstance().publish(
      new AutomationTriggeredEvent({
        ruleId: rule.id,
        ruleName: rule.name,
        campaignId: campaign.id,
        userId: rule.userId,
        actionType: rule.action.type,
        actionChannel: rule.action.channel,
        isTesting,
        triggeredAt: now.toISOString(),
        metricValue,
      })
    );

    // Auditoria técnica
    AuditLogService.getInstance().log({
      userId: rule.userId,
      tenantId: rule.tenantId,
      action: isTesting ? 'AUTOMATION_TESTED' : 'AUTOMATION_TRIGGERED',
      module: 'automation',
      entity: 'AutomationRule',
      entityId: rule.id,
      metadata: { campaignId: campaign.id, actionType: rule.action.type, isTesting },
    });

    return true;
  }

  // ── Helpers Internos ───────────────────────────────────────────────────────
  private extractMetricValue(metric: string, c: Campaign): number {
    switch (metric) {
      case 'ctr':
        return c.metrics.ctr;
      case 'conversionRate':
        return c.metrics.conversionRate;
      case 'roi':
        return c.roi;
      case 'clicks':
        return c.metrics.clicks;
      case 'shares':
        return c.metrics.shares;
      case 'daysSinceLastClick': {
        const last = c.updatedAt || c.createdAt;
        const diffMs = Date.now() - new Date(last).getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
      default:
        return 0;
    }
  }

  private compareValues(val: number, op: RuleOperator, target: number): boolean {
    switch (op) {
      case '>':
        return val > target;
      case '<':
        return val < target;
      case '>=':
        return val >= target;
      case '<=':
        return val <= target;
      case '==':
        return val === target;
      default:
        return false;
    }
  }
}
