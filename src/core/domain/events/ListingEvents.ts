import { IDomainEvent } from './DomainEventBus';

export interface PublishRequestedPayload extends Record<string, unknown> {
  listingId: string;
  offerId: string;
  productId: string;
  userId: string;
  marketplaceSlug: string;
  requestedAt: string;
}

export class PublishRequestedEvent implements IDomainEvent {
  public readonly eventName = 'PublishRequestedEvent';
  public readonly timestamp: string;
  public readonly payload: PublishRequestedPayload;

  constructor(payload: PublishRequestedPayload) {
    this.timestamp = payload.requestedAt || new Date().toISOString();
    this.payload = payload;
  }
}

export interface ListingPublishedPayload extends Record<string, unknown> {
  listingId: string;
  offerId: string;
  userId: string;
  marketplaceSlug: string;
  externalId: string;
  listingUrl: string;
  publishedAt: string;
}

export class ListingPublishedEvent implements IDomainEvent {
  public readonly eventName = 'ListingPublishedEvent';
  public readonly timestamp: string;
  public readonly payload: ListingPublishedPayload;

  constructor(payload: ListingPublishedPayload) {
    this.timestamp = payload.publishedAt || new Date().toISOString();
    this.payload = payload;
  }
}

export interface ListingPublishFailedPayload extends Record<string, unknown> {
  listingId: string;
  offerId: string;
  userId: string;
  marketplaceSlug: string;
  error: string;
  failedAt: string;
}

export class ListingPublishFailedEvent implements IDomainEvent {
  public readonly eventName = 'ListingPublishFailedEvent';
  public readonly timestamp: string;
  public readonly payload: ListingPublishFailedPayload;

  constructor(payload: ListingPublishFailedPayload) {
    this.timestamp = payload.failedAt || new Date().toISOString();
    this.payload = payload;
  }
}
