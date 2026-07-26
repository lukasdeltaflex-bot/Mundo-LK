import { INotificationService, NotificationMessage } from '../../core/domain/ports/notifications/INotificationService';

export class NotificationService implements INotificationService {
  private static instance: NotificationService;

  constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async notify(message: NotificationMessage): Promise<void> {
    console.log(`[NotificationCenter] [${message.severity}] ${message.title}: ${message.body}`);
  }
}
