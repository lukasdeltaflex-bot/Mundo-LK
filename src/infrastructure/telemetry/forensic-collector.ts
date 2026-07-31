/**
 * MUNDO LK — COLETOR FORENSE READ-ONLY (PROTOCOLO CONGELADO)
 * 
 * Este módulo implementa a coleta estritamente observacional (Read-Only)
 * sem interferir na ordem de execução, Promises, renderização ou estado da aplicação.
 */

export interface ForensicEvent {
  eventId: number;
  traceId: string;
  loadProductsId?: string;
  authEventId?: number;
  category: 'BOOT' | 'PERSISTENCE' | 'AUTH' | 'AUTH_CONTEXT' | 'PROTECTED_ROUTE' | 'PRODUTOS' | 'REPOSITORY' | 'FIRESTORE' | 'TOKEN' | 'INDEXEDDB' | 'STORAGE' | 'ENVIRONMENT';
  eventName: string;
  timestampRelMs: number;
  timestampAbsMs: number;
  timeDeltaMs: number;
  pathname: string;
  visibilityState: string;
  onLine: boolean;
  stateHash?: string;
  details: Record<string, any>;
}

export interface ForensicTraceArtifact {
  traceId: string;
  sessionId: string;
  bootId: string;
  environment: 'Chrome' | 'Safari' | 'Unknown';
  browser: string;
  platform: string;
  userAgent: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  metrics: {
    totalEvents: number;
    totalRenders: number;
    totalQueries: number;
    totalErrors: number;
    totalRedirects: number;
  };
  stateHashInitial: string;
  stateHashFinal: string;
  traceHash: string;
  events: ForensicEvent[];
}

class ForensicCollector {
  private traceId: string = '';
  private sessionId: string = '';
  private bootId: string = '';
  private events: ForensicEvent[] = [];
  private eventCounter: number = 0;
  private lastEventTime: number = 0;
  private startTime: number = 0;
  private isRecording: boolean = false;

  private renderCount: number = 0;
  private queryCount: number = 0;
  private errorCount: number = 0;
  private redirectCount: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initNewTrace();
    }
  }

  public initNewTrace(customTraceId?: string): string {
    const randomId = Math.random().toString(36).substring(2, 10);
    this.traceId = customTraceId || `trace-${randomId}`;
    this.sessionId = new Date().toISOString();
    this.bootId = `boot-${randomId}`;
    this.events = [];
    this.eventCounter = 0;
    this.renderCount = 0;
    this.queryCount = 0;
    this.errorCount = 0;
    this.redirectCount = 0;
    this.startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.lastEventTime = this.startTime;
    this.isRecording = true;

    this.recordEnvironmentData();
    return this.traceId;
  }

  public getTraceId(): string {
    return this.traceId;
  }

  private computeStateHash(data: Record<string, any>): string {
    try {
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return `hash-${Math.abs(hash).toString(16)}`;
    } catch {
      return 'hash-error';
    }
  }

  public recordEvent(
    category: ForensicEvent['category'],
    eventName: string,
    details: Record<string, any>,
    extraState?: { loadProductsId?: string; authEventId?: number }
  ): void {
    if (!this.isRecording && typeof window !== 'undefined') {
      this.initNewTrace();
    }

    const nowRel = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const nowAbs = Date.now();
    const delta = this.lastEventTime > 0 ? nowRel - this.lastEventTime : 0;
    this.lastEventTime = nowRel;
    this.eventCounter++;

    if (category === 'PROTECTED_ROUTE' && details.decision?.includes('render')) {
      this.renderCount++;
    }
    if (category === 'FIRESTORE' && eventName.includes('INICIANDO')) {
      this.queryCount++;
    }
    if (details.error || details.errorCode || category === 'FIRESTORE' && eventName.includes('ERRO')) {
      this.errorCount++;
    }
    if (details.decision?.includes('redirect')) {
      this.redirectCount++;
    }

    const event: ForensicEvent = {
      eventId: this.eventCounter,
      traceId: this.traceId,
      loadProductsId: extraState?.loadProductsId,
      authEventId: extraState?.authEventId,
      category,
      eventName,
      timestampRelMs: Number(nowRel.toFixed(3)),
      timestampAbsMs: nowAbs,
      timeDeltaMs: Number(delta.toFixed(3)),
      pathname: typeof window !== 'undefined' ? window.location.pathname : '',
      visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
      onLine: typeof navigator !== 'undefined' ? navigator.onLine : true,
      stateHash: this.computeStateHash(details),
      details,
    };

    this.events.push(event);

    // Read-only console logger for live observation
    console.log(`[TRACE ${this.traceId}][${category}] ${eventName} (+${delta.toFixed(1)}ms)`, details);
  }

  private recordEnvironmentData(): void {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua) || /iPhone|iPad|iPod/i.test(ua);
    const isChrome = /chrome|crios/i.test(ua) && !isSafari;
    const environment = isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Unknown';

    this.recordEvent('ENVIRONMENT', 'CAPTURAR_AMBIENTE', {
      userAgent: ua,
      environment,
      vendor: navigator.vendor,
      platform: navigator.platform,
      standalone: (navigator as any).standalone || false,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
      hostname: window.location.hostname,
      origin: window.location.origin,
      screen: {
        width: window.screen?.width,
        height: window.screen?.height,
        devicePixelRatio: window.devicePixelRatio,
      },
    });

    this.recordStorageData();
  }

  private recordStorageData(): void {
    if (typeof window === 'undefined') return;

    let localStorageUser = null;
    try {
      localStorageUser = localStorage.getItem('mundo_lk_user');
    } catch (e) {
      localStorageUser = `ERRO_ACESSO: ${(e as Error).message}`;
    }

    this.recordEvent('STORAGE', 'CAPTURAR_STORAGE', {
      hasLocalStorageUser: !!localStorageUser,
      localStorageUserSnippet: localStorageUser ? `${localStorageUser.substring(0, 40)}...` : null,
      cookieStringLength: document.cookie ? document.cookie.length : 0,
      cookieHasSession: document.cookie.includes('session') || document.cookie.includes('auth'),
    });
  }

  public async generateArtifact(environmentName: 'Chrome' | 'Safari' | 'Unknown'): Promise<ForensicTraceArtifact> {
    const finishedRel = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = finishedRel - this.startTime;

    const initialHash = this.events.length > 0 ? this.events[0].stateHash || 'initial' : 'none';
    const finalHash = this.events.length > 0 ? this.events[this.events.length - 1].stateHash || 'final' : 'none';

    const eventsJson = JSON.stringify(this.events);

    let traceHash = 'sha256-fallback';
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const msgBuffer = new TextEncoder().encode(eventsJson);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        traceHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch {
        traceHash = `simple-${this.computeStateHash({ eventsJson })}`;
      }
    }

    return {
      traceId: this.traceId,
      sessionId: this.sessionId,
      bootId: this.bootId,
      environment: environmentName,
      browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      startedAt: this.sessionId,
      finishedAt: new Date().toISOString(),
      durationMs: Number(duration.toFixed(3)),
      metrics: {
        totalEvents: this.events.length,
        totalRenders: this.renderCount,
        totalQueries: this.queryCount,
        totalErrors: this.errorCount,
        totalRedirects: this.redirectCount,
      },
      stateHashInitial: initialHash,
      stateHashFinal: finalHash,
      traceHash,
      events: [...this.events],
    };
  }

  public downloadArtifactJson(filename: string, artifact: ForensicTraceArtifact): void {
    if (typeof window === 'undefined') return;

    const jsonStr = JSON.stringify(artifact, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`[FORENSIC COLLECTOR] Artefato ${filename} baixado com sucesso! TRACE_HASH: ${artifact.traceHash}`);
  }
}

// Singleton global imutável
export const forensicCollector = new ForensicCollector();
