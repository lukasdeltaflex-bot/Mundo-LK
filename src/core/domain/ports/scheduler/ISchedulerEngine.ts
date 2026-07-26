export interface ScheduledTask {
  id: string;
  cronExpression: string;
  name: string;
}

export interface ISchedulerEngine {
  scheduleTask(name: string, cronExpression: string, handler: () => Promise<void>): ScheduledTask;
  cancelTask(id: string): void;
}
