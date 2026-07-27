export type ExtractionStepStatus =
  | 'PENDING'
  | 'EXPANDING_URL'
  | 'CACHE'
  | 'FETCHING'
  | 'PARSING'
  | 'NORMALIZING'
  | 'VALIDATING'
  | 'WAITING_CONFIRMATION'
  | 'GENERATING_AI'
  | 'COMPLETED'
  | 'FAILED';

export interface ExtractionSessionStep {
  step: ExtractionStepStatus;
  label: string;
  timestamp: string;
  completed: boolean;
  error?: string;
}

export interface ExtractionSession {
  sessionId: string;
  requestId: string;
  originalUrl: string;
  normalizedUrl?: string;
  canonicalUrl?: string;
  productId?: string;
  marketplace?: string;
  providerUsed?: string;
  confidenceScore: number;
  status: ExtractionStepStatus;
  currentStepLabel: string;
  steps: ExtractionSessionStep[];
  cacheHit: boolean;
  cacheTier?: 'L1_MEMORY' | 'L2_FIRESTORE' | 'NONE';
  startedAt: string;
  finishedAt?: string;
  error?: string;
}
