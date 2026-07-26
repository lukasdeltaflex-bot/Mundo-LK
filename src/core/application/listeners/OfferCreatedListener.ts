import { IDomainEvent } from '../../domain/events/IDomainEvent';
import { OfferCreatedPayload } from '../../domain/events/OfferCreatedEvent';

/**
 * Application Layer Listener for OfferCreatedEvent.
 * Reacts to offer creation for analytics, logging, and notifications without tight coupling.
 */
export class OfferCreatedListener {
  public async handle(event: IDomainEvent<OfferCreatedPayload>): Promise<void> {
    const { offer, product } = event.payload;
    // Decoupled handling (Logging, Analytics update, Notifications)
    console.log(`[OfferCreatedListener] Offer ${offer.id} created for product "${product.title}" with score ${offer.scoreValue}.`);
  }
}
