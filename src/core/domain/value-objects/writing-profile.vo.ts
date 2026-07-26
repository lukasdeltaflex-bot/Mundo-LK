export type WritingProfileType =
  | 'AGRESSIVO_VENDAS'
  | 'ELEGANTE'
  | 'INFORMATIVO'
  | 'PREMIUM'
  | 'CASUAL'
  | 'HUMOR'
  | 'CONVERSA_NATURAL'
  | 'PERSUASAO_MAXIMA';

export class WritingProfile {
  public readonly type: WritingProfileType;
  public readonly label: string;
  public readonly description: string;
  public readonly tonePrompt: string;

  private constructor(type: WritingProfileType, label: string, description: string, tonePrompt: string) {
    this.type = type;
    this.label = label;
    this.description = description;
    this.tonePrompt = tonePrompt;
  }

  public static create(type: WritingProfileType = 'CONVERSA_NATURAL'): WritingProfile {
    switch (type) {
      case 'AGRESSIVO_VENDAS':
        return new WritingProfile(
          'AGRESSIVO_VENDAS',
          'Agressivo em Vendas',
          'Urgência máxima, gatilhos de escassez e chamadas imperativas para compra imediata.',
          'Tom altamente persuasivo e urgente. Use caixa alta em palavras de ordem (CORRA, ÚLTIMAS UNIDADES, PREÇO MÍNIMO) e múltiplos emojis de fogo/raio.'
        );
      case 'ELEGANTE':
        return new WritingProfile(
          'ELEGANTE',
          'Elegante & Sofisticado',
          'Linguagem refinada, termos suntuosos e foco no design e valor do produto.',
          'Tom sofisticado, sem exageros de emojis. Destaque a excelência estética, acabamento e exclusividade do produto.'
        );
      case 'INFORMATIVO':
        return new WritingProfile(
          'INFORMATIVO',
          'Informativo & Técnico',
          'Foco em especificações técnicas, comparativos reais e análise imparcial.',
          'Tom jornalístico e direto ao ponto. Apresente os dados técnicos, memória, recursos e custo-benefício de forma clara.'
        );
      case 'PREMIUM':
        return new WritingProfile(
          'PREMIUM',
          'Premium & VIP',
          'Foco na experiência exclusiva, garantia de produto top de linha.',
          'Tom VIP e exclusivo. Trate o consumidor como alguém que exige o melhor e reconhece a alta qualidade.'
        );
      case 'CASUAL':
        return new WritingProfile(
          'CASUAL',
          'Casual & Descontraído',
          'Linguagem jovem, leve e amigável para redes sociais.',
          'Tom descontraído e leve, como uma recomendação entre amigos sem pressão comercial explícita.'
        );
      case 'HUMOR':
        return new WritingProfile(
          'HUMOR',
          'Humor & Memes',
          'Uso de piadas leves, memes e tiradas divertidas para engajamento virada.',
          'Tom divertido com sacadas inteligentes e bem-humoradas que prendem a atenção no feed.'
        );
      case 'PERSUASAO_MAXIMA':
        return new WritingProfile(
          'PERSUASAO_MAXIMA',
          'Persuasão Máxima (Copywriting)',
          'Aplicação de fórmulas clássicas de copywriting (AIDA, PAS) para máxima conversão.',
          'Estrutura AIDA (Atenção, Interesse, Desejo, Ação) para transformar curiosidade em venda garantida.'
        );
      case 'CONVERSA_NATURAL':
      default:
        return new WritingProfile(
          'CONVERSA_NATURAL',
          'Conversa Natural',
          'Comunicação fluida, empática e natural como em uma conversa de WhatsApp.',
          'Tom amigável e direto. Escreva de forma orgânica, sem parecer uma propaganda robótica.'
        );
    }
  }

  public static getAllProfiles(): WritingProfile[] {
    return [
      WritingProfile.create('CONVERSA_NATURAL'),
      WritingProfile.create('AGRESSIVO_VENDAS'),
      WritingProfile.create('PERSUASAO_MAXIMA'),
      WritingProfile.create('ELEGANTE'),
      WritingProfile.create('PREMIUM'),
      WritingProfile.create('INFORMATIVO'),
      WritingProfile.create('CASUAL'),
      WritingProfile.create('HUMOR'),
    ];
  }
}
