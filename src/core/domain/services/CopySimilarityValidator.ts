/**
 * Service responsible for validating that newly generated copies
 * are semantically distinct from recent copies, preventing generic repetitive templates.
 */
export class CopySimilarityValidator {
  private static recentCopiesHistory: string[] = [];
  private static MAX_HISTORY = 20;

  /**
   * Tokenizes text into a normalized set of significant words (length > 3).
   */
  private static tokenize(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    return new Set(words);
  }

  /**
   * Calculates Jaccard Similarity between two texts.
   * Returns a score between 0.0 (completely distinct) and 1.0 (identical).
   */
  public static calculateSimilarity(textA: string, textB: string): number {
    const tokensA = this.tokenize(textA);
    const tokensB = this.tokenize(textB);

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    tokensA.forEach((token) => {
      if (tokensB.has(token)) intersection++;
    });

    const union = new Set([...Array.from(tokensA), ...Array.from(tokensB)]).size;
    return intersection / union;
  }

  /**
   * Checks if a newly generated copy is too similar (> 65% similarity)
   * to any of the last 20 generated copies.
   */
  public static isTooSimilarToHistory(newCopy: string, threshold = 0.65): boolean {
    for (const pastCopy of this.recentCopiesHistory) {
      const similarity = this.calculateSimilarity(newCopy, pastCopy);
      if (similarity >= threshold) {
        console.warn(`[CopySimilarityValidator] ⚠️ Alta similaridade detectada (${(similarity * 100).toFixed(1)}%).`);
        return true;
      }
    }
    return false;
  }

  /**
   * Registers a newly generated copy into the sliding history buffer.
   */
  public static registerCopy(copy: string): void {
    if (!copy || copy.trim().length < 20) return;
    this.recentCopiesHistory.unshift(copy.trim());
    if (this.recentCopiesHistory.length > this.MAX_HISTORY) {
      this.recentCopiesHistory.pop();
    }
  }

  /**
   * Clears history (used in tests or manual reset).
   */
  public static resetHistory(): void {
    this.recentCopiesHistory = [];
  }
}
