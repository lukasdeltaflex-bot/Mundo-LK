import { IQueueEngine, Job } from '../../core/domain/ports/queue/IQueueEngine';

export class QueueService implements IQueueEngine {
  private static instance: QueueService;
  // eslint-disable-next-line
  private handlers: Map<string, (job: Job<any>) => Promise<void>> = new Map();

  constructor() {}

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  public async enqueue<T>(type: string, data: T): Promise<Job<T>> {
    const job: Job<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      data,
      createdAt: new Date(),
    };

    const handler = this.handlers.get(type);
    if (handler) {
      setTimeout(async () => {
        try {
          await handler(job);
        } catch (err) {
          console.error(`[QueueService] Error processing job ${job.id}:`, err);
        }
      }, 0);
    }

    return job;
  }

  public process<T>(type: string, handler: (job: Job<T>) => Promise<void>): void {
    // eslint-disable-next-line
    this.handlers.set(type, handler as (job: Job<any>) => Promise<void>);
  }
}
