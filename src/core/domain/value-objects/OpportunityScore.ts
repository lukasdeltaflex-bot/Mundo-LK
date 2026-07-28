import { CompetitionLevel } from '../entities/marketplace-trend.entity';

export interface OpportunityScoreBreakdown {
  demandScore: number;      // 0-100 (volume de buscas)
  competitionScore: number; // 0-100 (inverso da saturação)
  marginScore: number;      // 0-100 (estimativa de comissão)
  trendScore: number;       // 0-100 (taxa de crescimento recente)
  finalScore: number;       // Média ponderada (0-100)
}

/**
 * OpportunityScore — Value Object Preditivo de Oportunidade (Release 2.3.2)
 *
 * Fórmula Heurística:
 *   FinalScore = (0.35 * Demand) + (0.25 * Competition) + (0.25 * Margin) + (0.15 * Trend)
 */
export class OpportunityScore {
  public static calculate(params: {
    searchVolumeGrowthPct: number;
    competitionLevel: CompetitionLevel;
    avgPrice: number;
  }): OpportunityScoreBreakdown {
    // 1. Demand Score (baseado no crescimento de buscas)
    const demandScore = Math.min(Math.max(params.searchVolumeGrowthPct, 0), 100);

    // 2. Competition Score (baixa concorrência = pontuação alta)
    let competitionScore = 50;
    if (params.competitionLevel === 'LOW') competitionScore = 90;
    else if (params.competitionLevel === 'MEDIUM') competitionScore = 65;
    else if (params.competitionLevel === 'HIGH') competitionScore = 30;

    // 3. Margin Score (produtos com ticket médio saudável geram comissão melhor)
    let marginScore = 60;
    if (params.avgPrice >= 100) marginScore = 85;
    else if (params.avgPrice >= 50) marginScore = 70;
    else marginScore = 50;

    // 4. Trend Score (aceleração do crescimento)
    const trendScore = Math.min(params.searchVolumeGrowthPct * 0.8, 100);

    // Média Ponderada
    const finalScore = Math.round(
      0.35 * demandScore + 0.25 * competitionScore + 0.25 * marginScore + 0.15 * trendScore
    );

    return {
      demandScore: Math.round(demandScore),
      competitionScore: Math.round(competitionScore),
      marginScore: Math.round(marginScore),
      trendScore: Math.round(trendScore),
      finalScore: Math.min(Math.max(finalScore, 0), 100),
    };
  }
}
