import { MarketplaceConnectionSlug } from '../entities/marketplace-connection.entity';

export interface IntegrationTestResult {
  success: boolean;
  httpStatus: number;
  latencyMs: number;
  endpoint: string;
  provider: MarketplaceConnectionSlug;
  authenticatedAccount?: string | null;
  environment: 'production' | 'sandbox';
  expiresAt?: string | null;
  scopes?: string[];
  message: string;
  rawResponse?: Record<string, unknown>;
  details?: Record<string, unknown>;
}
