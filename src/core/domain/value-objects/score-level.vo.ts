export type ScoreType = 'EXCELLENT' | 'GOOD' | 'REGULAR';

/**
 * Value Object representing the Score Level classification (0 to 100).
 */
export class ScoreLevel {
  public readonly score: number;
  public readonly level: ScoreType;

  constructor(score: number) {
    if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
      throw new Error(`Score must be between 0 and 100. Received: ${score}`);
    }
    this.score = Math.round(score);
    this.level = this.calculateLevel(this.score);
  }

  public static create(score: number): ScoreLevel {
    return new ScoreLevel(score);
  }

  private calculateLevel(score: number): ScoreType {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 50) return 'GOOD';
    return 'REGULAR';
  }

  public getLabelPtBR(): string {
    switch (this.level) {
      case 'EXCELLENT':
        return 'Oferta Excelente';
      case 'GOOD':
        return 'Boa Oferta';
      case 'REGULAR':
        return 'Preço Comum';
    }
  }
}
