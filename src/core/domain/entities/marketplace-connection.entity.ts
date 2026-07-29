export type IntegrationCategory =
  | 'Marketplaces'
  | 'IA Core'
  | 'Redes Sociais'
  | 'Mensageria'
  | 'Google & Ads'
  | 'ERPs & E-commerce'
  | 'Pagamentos';

export type IntegrationStatus =
  | 'CONNECTED'
  | 'VALIDATING'
  | 'WARNING'
  | 'ERROR'
  | 'EXPIRED'
  | 'DISABLED'
  | 'CONFIGURATION_REQUIRED';

export type IntegrationCapability =
  | 'publish'
  | 'importProducts'
  | 'syncStock'
  | 'syncOrders'
  | 'analytics'
  | 'chatAI'
  | 'generateImage';

export type MarketplaceConnectionSlug =
  | 'mercadolivre'
  | 'shopee'
  | 'amazon'
  | 'magalu'
  | 'shein'
  | 'tiktok_shop'
  | 'whatsapp'
  | 'telegram'
  | 'discord'
  | 'instagram'
  | 'facebook'
  | 'gemini'
  | 'openai'
  | 'claude'
  | 'grok'
  | 'deepseek'
  | 'google_ads'
  | 'meta_ads'
  | 'bling'
  | 'tiny'
  | 'shopify'
  | 'nuvemshop'
  | 'stripe'
  | 'mercadopago';

export interface MarketplaceCredentials {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  partnerId?: string;
  partnerKey?: string;
  shopId?: string;
  phoneNumberId?: string;
  apiKey?: string;
  developerToken?: string;
  secretKey?: string;
  [key: string]: string | undefined;
}

export interface CredentialFieldSchema {
  key: keyof MarketplaceCredentials;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
  required?: boolean;
}

export interface IntegrationDefinition {
  slug: MarketplaceConnectionSlug;
  name: string;
  category: IntegrationCategory;
  description: string;
  capabilities: IntegrationCapability[];
  fields: CredentialFieldSchema[];
}

export type ConnectionStatus = IntegrationStatus;
export type CredentialSource = 'USER_CONFIGURED' | 'VERCEL_ENV' | 'TENANT' | 'ENV_FALLBACK' | 'NONE';

export interface IntegrationConnectionProps {
  id: string;
  userId: string;
  tenantId?: string;
  marketplaceSlug: MarketplaceConnectionSlug;
  name: string;
  category: IntegrationCategory;
  credentials: MarketplaceCredentials;
  status: IntegrationStatus;
  capabilities?: IntegrationCapability[];
  schemaVersion?: number;
  healthScore?: number;
  storeName?: string | null;
  accountId?: string | null;
  source?: CredentialSource;
  lastTestedAt?: string | null;
  lastSyncAt?: string | null;
  lastError?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * IntegrationConnection — Entidade Unificada de Integrações & Credenciais Enterprise (Release 4.0)
 *
 * Suporta versionamento de schema (schemaVersion: 1), capabilities por canal,
 * estados ricos de conexão e mascaramento seguro de segredos.
 */
export class IntegrationConnection {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly marketplaceSlug: MarketplaceConnectionSlug;
  public name: string;
  public category: IntegrationCategory;
  public credentials: MarketplaceCredentials;
  public status: IntegrationStatus;
  public capabilities: IntegrationCapability[];
  public schemaVersion: number;
  public healthScore: number;
  public storeName?: string | null;
  public accountId?: string | null;
  public source?: CredentialSource;
  public lastTestedAt?: string | null;
  public lastSyncAt?: string | null;
  public lastError?: string | null;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: IntegrationConnectionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.marketplaceSlug = props.marketplaceSlug;
    this.name = props.name;
    this.category = props.category || 'Marketplaces';
    this.credentials = props.credentials || {};
    this.status = props.status || 'CONFIGURATION_REQUIRED';
    this.capabilities = props.capabilities || [];
    this.schemaVersion = props.schemaVersion || 1;
    this.healthScore = props.healthScore ?? 100;
    this.storeName = props.storeName || null;
    this.accountId = props.accountId || null;
    this.source = props.source || 'NONE';
    this.lastTestedAt = props.lastTestedAt || null;
    this.lastSyncAt = props.lastSyncAt || null;
    this.lastError = props.lastError || null;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  public isConfigured(): boolean {
    return this.status === 'CONNECTED' || this.status === 'VALIDATING' || this.status === 'WARNING';
  }
}

// Alias para compatibilidade com o código legado
export { IntegrationConnection as MarketplaceConnection };
