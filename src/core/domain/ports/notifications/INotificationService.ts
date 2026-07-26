export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface NotificationMessage {
  title: string;
  body: string;
  severity: NotificationSeverity;
  metadata?: Record<string, unknown>;
}

export interface INotificationService {
  notify(message: NotificationMessage): Promise<void>;
}
