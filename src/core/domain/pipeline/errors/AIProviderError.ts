export class AIProviderError extends Error {
  public readonly providerName: string;
  public readonly statusCode?: number;

  constructor(message: string, providerName: string, statusCode?: number) {
    super(message);
    this.name = 'AIProviderError';
    this.providerName = providerName;
    this.statusCode = statusCode;
  }
}
