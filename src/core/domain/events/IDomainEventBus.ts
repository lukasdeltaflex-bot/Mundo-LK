import { IDomainEvent } from './IDomainEvent';

export type EventHandler<T = unknown> = (event: IDomainEvent<T>) => Promise<void> | void;

export interface IDomainEventBus {
  publish<T>(event: IDomainEvent<T>): Promise<void>;
  subscribe<T>(eventName: string, handler: EventHandler<T>): void;
  unsubscribe<T>(eventName: string, handler: EventHandler<T>): void;
}
