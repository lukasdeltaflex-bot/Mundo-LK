export interface TraceContextProps {
  traceId: string;
  correlationId: string;
  sessionId: string;
  tenantId: string;
  userId: string;
  environment: 'development' | 'staging' | 'production';
  timestamp: string;
}

export class TraceContext {
  public static create(params?: Partial<TraceContextProps>): TraceContextProps {
    const now = Date.now().toString(36);
    const hires = Math.floor(performance.now() * 1000).toString(36);

    return {
      traceId: params?.traceId || `trc_${now}_${hires}`,
      correlationId: params?.correlationId || `crl_${now}_${hires}`,
      sessionId: params?.sessionId || `sess_${now}_${hires}`,
      tenantId: params?.tenantId || 'tenant_default',
      userId: params?.userId || 'user_default',
      environment: (process.env.NODE_ENV as any) || 'production',
      timestamp: new Date().toISOString(),
    };
  }
}
