import { InvalidLinkError } from '../errors/domain.error';

/**
 * Value Object representing a validated Affiliate Link.
 */
export class AffiliateLink {
  public readonly url: string;

  constructor(url: string) {
    if (!url || typeof url !== 'string') {
      throw new InvalidLinkError('URL cannot be empty.');
    }
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new InvalidLinkError(`URL must start with http:// or https://. Received: ${url}`);
    }
    this.url = trimmed;
  }

  public static create(url: string): AffiliateLink {
    return new AffiliateLink(url);
  }

  public getDomain(): string {
    try {
      const parsed = new URL(this.url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  public equals(other: AffiliateLink): boolean {
    return this.url === other.url;
  }
}
