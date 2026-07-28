export interface SendNotificationParams {
  recipient: string;
  message: string;
  payload?: Record<string, unknown>;
}

export interface SendNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface INotificationProvider {
  name: string;
  isConfigured(): boolean;
  send(params: SendNotificationParams): Promise<SendNotificationResult>;
}
