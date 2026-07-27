export interface ObservabilityContext {
  sessionId: string;
  requestId: string;
  providerId?: string;
  aiRequestId?: string;
  marketplace?: string;
  timestamp: string;
}

export function createObservabilityContext(sessionId?: string): ObservabilityContext {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return {
    sessionId: sessionId || `sess_${now}_${rand}`,
    requestId: `req_${now}_${rand}`,
    timestamp: new Date().toISOString(),
  };
}
