import { ScoreLevel } from '../value-objects/score-level.vo';

export interface ScoreFactor {
  name: string;
  weight: number;
  score: number;
  reason: string;
}

export interface ScoreProps {
  value: number;
  justification: string;
  factors: ScoreFactor[];
}

export class Score {
  public readonly value: number;
  public readonly level: ScoreLevel;
  public readonly justification: string;
  public readonly factors: ScoreFactor[];

  constructor(props: ScoreProps) {
    this.value = props.value;
    this.level = ScoreLevel.create(props.value);
    this.justification = props.justification;
    this.factors = props.factors;
  }
}
