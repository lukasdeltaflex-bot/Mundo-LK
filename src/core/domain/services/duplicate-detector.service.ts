export interface DuplicateMatchResult {
  isDuplicate: boolean;
  confidence: number; // 0 to 100
  matchedProduct?: {
    id: string;
    title: string;
    addedAt: string;
    publicationCount: number;
  };
}

export class DuplicateDetectorService {
  public static checkDuplicate(
    newTitle: string,
    existingProducts: Array<{ id: string; title: string; createdAt?: string; publicationCount?: number }>
  ): DuplicateMatchResult {
    const cleanNew = newTitle.toLowerCase().replace(/[^a-z0-9]/g, ' ');

    for (const prod of existingProducts) {
      const cleanExisting = prod.title.toLowerCase().replace(/[^a-z0-9]/g, ' ');
      const wordsNew = new Set(cleanNew.split(' ').filter((w) => w.length > 3));
      const wordsExisting = new Set(cleanExisting.split(' ').filter((w) => w.length > 3));

      if (wordsNew.size === 0 || wordsExisting.size === 0) continue;

      let intersectionCount = 0;
      wordsNew.forEach((word) => {
        if (wordsExisting.has(word)) intersectionCount++;
      });

      const similarity = Math.round((intersectionCount / Math.max(wordsNew.size, wordsExisting.size)) * 100);

      if (similarity >= 60) {
        return {
          isDuplicate: true,
          confidence: similarity,
          matchedProduct: {
            id: prod.id,
            title: prod.title,
            addedAt: prod.createdAt || 'Hoje',
            publicationCount: prod.publicationCount || 0,
          },
        };
      }
    }

    return { isDuplicate: false, confidence: 0 };
  }
}
