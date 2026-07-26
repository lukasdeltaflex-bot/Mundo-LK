export interface AIMemoryProps {
  userId: string;
  preferredStyle?: string;
  copiedCTAs?: string[];
  bannedWords?: string[];
  preferredWords?: string[];
  favoriteCategories?: string[];
  favoriteMarketplaces?: string[];
  favoriteHashtags?: string[];
  avgTextLength?: 'SHORT' | 'MEDIUM' | 'LONG';
  activeHours?: string[];
  favoriteChannels?: string[];
  updatedAt?: Date;
}

export class AIMemory {
  public readonly userId: string;
  public preferredStyle: string;
  public copiedCTAs: string[];
  public bannedWords: string[];
  public preferredWords: string[];
  public favoriteCategories: string[];
  public favoriteMarketplaces: string[];
  public favoriteHashtags: string[];
  public avgTextLength: 'SHORT' | 'MEDIUM' | 'LONG';
  public activeHours: string[];
  public favoriteChannels: string[];
  public updatedAt: Date;

  constructor(props: AIMemoryProps) {
    this.userId = props.userId;
    this.preferredStyle = props.preferredStyle || 'Conversa natural e persuasiva';
    this.copiedCTAs = props.copiedCTAs || ['👉 Clique aqui para aproveitar!'];
    this.bannedWords = props.bannedWords || [];
    this.preferredWords = props.preferredWords || ['Imperdível', 'Verificado', 'Menor Preço'];
    this.favoriteCategories = props.favoriteCategories || ['Eletrônicos', 'Casa'];
    this.favoriteMarketplaces = props.favoriteMarketplaces || ['Shopee', 'Mercado Livre'];
    this.favoriteHashtags = props.favoriteHashtags || ['#mundolk', '#ofertas'];
    this.avgTextLength = props.avgTextLength || 'MEDIUM';
    this.activeHours = props.activeHours || ['11:30', '19:00'];
    this.favoriteChannels = props.favoriteChannels || ['WhatsApp', 'Telegram'];
    this.updatedAt = props.updatedAt || new Date();
  }

  public recordCopiedCTA(cta: string): void {
    if (!this.copiedCTAs.includes(cta)) {
      this.copiedCTAs.push(cta);
    }
    this.updatedAt = new Date();
  }

  public toPromptContext(): string {
    return `
[MEMÓRIA E PREFERÊNCIAS DO AFILIADO DO MUNDO LK]
- Estilo de Escrita Preferido: ${this.preferredStyle}
- Tamanho de Texto Desejado: ${this.avgTextLength}
- Palavras Preferidas (Usar quando relevante): ${this.preferredWords.join(', ')}
${this.bannedWords.length > 0 ? `- Palavras Proibidas (NUNCA USAR): ${this.bannedWords.join(', ')}` : ''}
- Canais Principais: ${this.favoriteChannels.join(', ')}
- CTAs de Alta Conversão Registrados: ${this.copiedCTAs.slice(-3).join(' | ')}
`;
  }
}
