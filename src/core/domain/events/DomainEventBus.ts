export interface IDomainEvent {
  eventName: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export type EventCallback = (event: IDomainEvent) => Promise<void> | void;

export class DomainEventBus {
  private static instance: DomainEventBus;
  private listeners: Map<string, EventCallback[]> = new Map();

  private constructor() {}

  public static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
    }
    return DomainEventBus.instance;
  }

  public subscribe(eventName: string, callback: EventCallback): void {
    const existing = this.listeners.get(eventName) || [];
    existing.push(callback);
    this.listeners.set(eventName, existing);
  }

  public async publish(event: IDomainEvent): Promise<void> {
    const callbacks = this.listeners.get(event.eventName) || [];
    for (const callback of callbacks) {
      try {
        await callback(event);
      } catch (err) {
        console.error(`[EventBus] Error handling event ${event.eventName}:`, err);
      }
    }
  }
}
