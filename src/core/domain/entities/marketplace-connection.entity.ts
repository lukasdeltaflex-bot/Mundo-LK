export type MarketplaceConnectionSlug =
  | 'shopee'
  | 'mercadolivre'
  | 'whatsapp'
  | 'amazon'
  | 'telegram'
  | 'zenrows'
  | 'apify'
  | 'gemini'
  | 'openai';

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'EXPIRING';

export type CredentialSource = 'USER_CONFIGURED' | 'VERCEL_ENV';

export interface MarketplaceCredentials {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  partnerId?: string;
  partnerKey?: string;
  shopId?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  apiKey?: string;
}

export interface MarketplaceConnectionProps {
  id: string;
  userId: string;
  tenantId: string;
  marketplaceSlug: MarketplaceConnectionSlug;
  storeName?: string;
  accountId?: string;
  status: ConnectionStatus;
  credentials: MarketplaceCredentials;
  source: CredentialSource;
  lastSyncAt?: string;
  lastTestedAt?: string;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * MarketplaceConnection — Entidade do Gerenciador de Integrações (Enterprise)
 * Armazena o estado das conexões por tenant/usuário no Firestore.
 */
export class MarketplaceConnection {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly marketplaceSlug: MarketplaceConnectionSlug;
  public storeName?: string;
  public accountId?: string;
  public status: ConnectionStatus;
  public credentials: MarketplaceCredentials;
  public source: CredentialSource;
  public lastSyncAt?: string;
  public lastTestedAt?: string;
  public lastError?: string | null;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: MarketplaceConnectionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.marketplaceSlug = props.marketplaceSlug;
    this.storeName = props.storeName;
    this.accountId = props.accountId;
    this.status = props.status || 'DISCONNECTED';
    this.credentials = props.credentials || {};
    this.source = props.source || 'USER_CONFIGURED';
    this.lastSyncAt = props.lastSyncAt;
    this.lastTestedAt = props.lastTestedAt;
    this.lastError = props.lastError || null;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }
}
