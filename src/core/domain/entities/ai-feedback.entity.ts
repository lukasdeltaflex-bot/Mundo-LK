export interface AIFeedbackProps {
  id: string;
  offerId: string;
  userId: string;
  rating: number; // 1 to 5
  feedbackLabel: 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD';
  comments?: string;
  createdAt?: Date;
}

export class AIFeedback {
  public readonly id: string;
  public readonly offerId: string;
  public readonly userId: string;
  public rating: number;
  public feedbackLabel: 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'BAD';
  public comments: string;
  public createdAt: Date;

  constructor(props: AIFeedbackProps) {
    this.id = props.id;
    this.offerId = props.offerId;
    this.userId = props.userId;
    this.rating = Math.max(1, Math.min(5, props.rating));
    this.feedbackLabel = props.feedbackLabel;
    this.comments = props.comments || '';
    this.createdAt = props.createdAt || new Date();
  }
}
