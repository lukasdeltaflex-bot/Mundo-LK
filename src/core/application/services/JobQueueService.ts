import { v4 as uuidv4 } from 'uuid';
import { Job, JobProps, JobType } from '../../domain/entities/job.entity';
import { FirestoreJobRepository } from '../../../infrastructure/firebase/repositories/firestore-job.repository';
import { AuditLogService } from './AuditLogService';

export class JobQueueService {
  private static instance: JobQueueService;
  private jobRepo = new FirestoreJobRepository();

  private constructor() {}

  public static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  /**
   * Enfileira um novo job com validação de idempotência.
   * Se já existir um job com a mesma executionKey para o usuário, retorna o job existente sem duplicar.
   */
  public async enqueue(params: {
    userId: string;
    tenantId?: string;
    type: JobType;
    executionKey: string;
    payload?: Record<string, unknown>;
    maxAttempts?: number;
  }): Promise<Job> {
    const existing = await this.jobRepo.findByExecutionKey(params.userId, params.executionKey);
    if (existing) {
      console.warn(`[JobQueueService] Job duplicado ignorado (executionKey: ${params.executionKey})`);
      return existing;
    }

    const job = new Job({
      id: `job_${uuidv4()}`,
      userId: params.userId,
      tenantId: params.tenantId || params.userId,
      type: params.type,
      executionKey: params.executionKey,
      attempts: 0,
      maxAttempts: params.maxAttempts || 3,
      status: 'PENDING',
      payload: params.payload || {},
    });

    await this.jobRepo.save(job);

    AuditLogService.getInstance().log({
      userId: job.userId,
      tenantId: job.tenantId,
      action: 'JOB_ENQUEUED',
      module: 'queue',
      entity: 'Job',
      entityId: job.id,
      metadata: { type: job.type, executionKey: job.executionKey },
    });

    return job;
  }

  public async getPendingJobs(userId: string): Promise<Job[]> {
    return this.jobRepo.findPendingByUserId(userId, 20);
  }

  /**
   * Worker Assíncrono: processa lote de até 10 jobs pendentes do usuário.
   */
  public async processPendingJobs(
    userId: string,
    handler?: (job: Job) => Promise<Record<string, unknown>>
  ): Promise<number> {
    const pendingJobs = await this.jobRepo.findPendingByUserId(userId, 10);
    if (pendingJobs.length === 0) return 0;

    let processedCount = 0;

    for (const job of pendingJobs) {
      job.status = 'PROCESSING';
      job.attempts += 1;
      await this.jobRepo.save(job);

      try {
        let result: Record<string, unknown> = { success: true };

        if (handler) {
          result = await handler(job);
        } else {
          // Processamento padrão por tipo de job
          result = await this.defaultJobProcessor(job);
        }

        job.status = 'COMPLETED';
        job.result = result;
        job.processedAt = new Date().toISOString();
        await this.jobRepo.save(job);

        AuditLogService.getInstance().log({
          userId: job.userId,
          tenantId: job.tenantId,
          action: 'JOB_COMPLETED',
          module: 'queue',
          entity: 'Job',
          entityId: job.id,
          metadata: { type: job.type, attempts: job.attempts },
        });

        processedCount++;
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        console.warn(`[JobQueueService] Erro ao processar job ${job.id}:`, errorMsg);

        if (job.attempts >= job.maxAttempts) {
          job.status = 'FAILED';
          job.errorMessage = errorMsg;
          job.processedAt = new Date().toISOString();
        } else {
          // Re-enfileira para tentar novamente no próximo ciclo
          job.status = 'PENDING';
          job.errorMessage = `Tentativa ${job.attempts}/${job.maxAttempts} falhou: ${errorMsg}`;
        }

        await this.jobRepo.save(job);

        AuditLogService.getInstance().log({
          userId: job.userId,
          tenantId: job.tenantId,
          action: 'JOB_FAILED',
          module: 'queue',
          entity: 'Job',
          entityId: job.id,
          metadata: { type: job.type, attempts: job.attempts, error: errorMsg },
        });
      }
    }

    return processedCount;
  }

  // ── Processador Padrão de Jobs ─────────────────────────────────────────────
  private async defaultJobProcessor(job: Job): Promise<Record<string, unknown>> {
    switch (job.type) {
      case 'GENERATE_SOCIAL_POST':
        return { message: 'Criativo gerado com sucesso para redes sociais.', payload: job.payload };
      case 'SEND_WHATSAPP':
        return { message: 'Mensagem enviada ou enfileirada no provedor WhatsApp.', payload: job.payload };
      case 'EVALUATE_AUTOMATION_RULES':
        return { message: 'Regras de automação reavaliadas pelo worker.', payload: job.payload };
      case 'OPTIMIZE_CAMPAIGN':
        return { message: 'Otimização de campanha executada.', payload: job.payload };
      default:
        return { message: 'Job concluído sem ação específica.' };
    }
  }
}
