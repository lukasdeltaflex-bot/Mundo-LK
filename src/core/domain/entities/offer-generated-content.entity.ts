export interface OfferGeneratedContentProps {
  id: string;
  offerId: string;
  userId: string;
  tenantId?: string;
  style: string;
  provider: 'gemini' | 'openai' | 'local_fallback';
  model: string;
  temperature: number;
  systemPromptVersion: string;
  userPromptVersion: string;
  generatedText: string;
  affiliateUrl: string;
  createdAt?: string;
}

/**
 * OfferGeneratedContent — Histórico de Gerações por IA (Release 2.2.8.1)
 *
 * Registra o histórico completo de textos gerados pela IA com suporte a versionamento de prompts,
 * modelo utilizado, temperatura e rastreabilidade total.
 */
export class OfferGeneratedContent {
  public readonly id: string;
  public readonly offerId: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly style: string;
  public readonly provider: 'gemini' | 'openai' | 'local_fallback';
  public readonly model: string;
  public readonly temperature: number;
  public readonly systemPromptVersion: string;
  public readonly userPromptVersion: string;
  public readonly generatedText: string;
  public readonly affiliateUrl: string;
  public readonly createdAt: string;

  constructor(props: OfferGeneratedContentProps) {
    this.id = props.id;
    this.offerId = props.offerId;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.style = props.style || 'whatsapp';
    this.provider = props.provider || 'gemini';
    this.model = props.model || 'gemini-2.5-flash';
    this.temperature = props.temperature ?? 0.7;
    this.systemPromptVersion = props.systemPromptVersion || 'v1.0';
    this.userPromptVersion = props.userPromptVersion || 'v1.0';
    this.generatedText = props.generatedText;
    this.affiliateUrl = props.affiliateUrl;
    this.createdAt = props.createdAt || new Date().toISOString();
  }
}
