export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]> = new Map();
  private maxPerHour: number = 60;
  private windowMs: number = 60 * 60 * 1000; // 1 hour

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  public checkLimit(identifier: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxPerHour) {
      const oldest = validTimestamps[0];
      return {
        allowed: false,
        remaining: 0,
        resetMs: this.windowMs - (now - oldest),
      };
    }

    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);

    return {
      allowed: true,
      remaining: this.maxPerHour - validTimestamps.length,
      resetMs: 0,
    };
  }
}
