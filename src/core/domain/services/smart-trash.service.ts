export type ProductStatus = 'ACTIVE' | 'TRASHED' | 'ARCHIVED' | 'DELETED';

export type DeletionReason =
  | 'Produto esgotado'
  | 'Oferta encerrada'
  | 'Link inválido'
  | 'Produto duplicado'
  | 'Baixo desempenho'
  | 'Outro';

export interface TrashedProduct {
  id: string;
  title: string;
  category: string;
  marketplace: string;
  affiliateUrl: string;
  createdAt: string;
  deletedAt: string;
  deletionReason: DeletionReason;
  publicationCount: number;
  aiScore: number;
  status: ProductStatus;
  history: Array<{ date: string; text: string }>;
}

export class SmartTrashService {
  public static shouldWarnBeforeDeletion(publicationCount: number, aiScore: number): boolean {
    return publicationCount >= 2 || aiScore >= 80;
  }

  public static createTrashEvent(reason: DeletionReason): { date: string; text: string } {
    return {
      date: new Date().toLocaleString('pt-BR'),
      text: `Produto enviado para a lixeira (Motivo: ${reason})`,
    };
  }

  public static createRestoreEvent(): { date: string; text: string } {
    return {
      date: new Date().toLocaleString('pt-BR'),
      text: 'Produto restaurado da lixeira para o catálogo ativo',
    };
  }
}
