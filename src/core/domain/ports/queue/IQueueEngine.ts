export interface Job<T = unknown> {
  id: string;
  type: string;
  data: T;
  createdAt: Date;
}

export interface IQueueEngine {
  enqueue<T>(type: string, data: T): Promise<Job<T>>;
  process<T>(type: string, handler: (job: Job<T>) => Promise<void>): void;
}
