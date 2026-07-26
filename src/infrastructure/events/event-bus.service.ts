import { IDomainEventBus, EventHandler } from '../../core/domain/events/IDomainEventBus';
import { IDomainEvent } from '../../core/domain/events/IDomainEvent';

/**
 * Concrete In-Memory Event Bus Implementation.
 * Decouples event emission from side-effect execution.
 */
export class EventBusService implements IDomainEventBus {
  private static instance: EventBusService;
  private handlers: Map<string, Set<EventHandler>> = new Map();

  constructor() {}

  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  public subscribe<T>(eventName: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler as EventHandler);
  }

  public unsubscribe<T>(eventName: string, handler: EventHandler<T>): void {
    if (this.handlers.has(eventName)) {
      this.handlers.get(eventName)!.delete(handler as EventHandler);
    }
  }

  public async publish<T>(event: IDomainEvent<T>): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName);
    if (!eventHandlers || eventHandlers.size === 0) {
      return;
    }

    const executions = Array.from(eventHandlers).map(async (handler) => {
      try {
        await handler(event as IDomainEvent<unknown>);
      } catch (error) {
        console.error(`[EventBus] Error executing handler for event "${event.eventName}":`, error);
      }
    });

    await Promise.all(executions);
  }
}
