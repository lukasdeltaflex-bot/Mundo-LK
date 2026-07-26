/**
 * Base Exception for all Domain Layer errors.
 * Ensures domain errors are typed and distinct from framework errors.
 */
export class DomainError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidPriceError extends DomainError {
  constructor(message: string = 'Invalid price value. Price must be a non-negative number.') {
    super(message, 'INVALID_PRICE');
    this.name = 'InvalidPriceError';
  }
}

export class InvalidLinkError extends DomainError {
  constructor(message: string = 'Invalid URL or affiliate link format.') {
    super(message, 'INVALID_LINK');
    this.name = 'InvalidLinkError';
  }
}

export class InvalidDiscountError extends DomainError {
  constructor(message: string = 'Invalid discount percentage. Must be between 0 and 100.') {
    super(message, 'INVALID_DISCOUNT');
    this.name = 'InvalidDiscountError';
  }
}

export class MarketplaceNotSupportedError extends DomainError {
  constructor(url: string) {
    super(`No marketplace adapter registered for URL: ${url}`, 'MARKETPLACE_NOT_SUPPORTED');
    this.name = 'MarketplaceNotSupportedError';
  }
}
