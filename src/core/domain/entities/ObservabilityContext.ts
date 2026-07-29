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
  const hires = Math.floor(performance.now() * 1000).toString(36);
  return {
    sessionId: sessionId || `sess_${now}_${hires}`,
    requestId: `req_${now}_${hires}`,
    timestamp: new Date().toISOString(),
  };
}
