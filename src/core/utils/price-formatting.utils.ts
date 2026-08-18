/**
 * Price Formatting Utilities for Offer Copies & Descriptions
 * Ensures product price is bolded across Markdown, WhatsApp & HTML if present.
 *
 * @param copyText - The copy or description text to format
 * @param formattedPrice - The formatted price string (e.g., "R$ 49,90")
 * @param appendIfMissing - If true (e.g. for AI-generated template fallbacks), appends price line if missing.
 *                          If false (default for manual/ready user descriptions), preserves text 100% without appending price lines.
 */
export function ensurePriceBoldInCopy(
  copyText: string,
  formattedPrice: string,
  appendIfMissing: boolean = false
): string {
  if (!copyText || !copyText.trim()) {
    return (appendIfMissing && formattedPrice) ? `💰 *Preço:* *${formattedPrice}*` : (copyText || '');
  }

  if (!formattedPrice) return copyText;

  // Clean raw price text without Markdown asterisks (e.g., "R$ 49,90")
  const rawPriceStr = formattedPrice.replace(/\*/g, '').trim();
  if (!rawPriceStr) return copyText;

  // 1. Check if copyText already contains bolded price (*R$ 49,90* or **R$ 49,90** or <b>R$ 49,90</b>)
  const escapedPrice = rawPriceStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const alreadyBoldRegex = new RegExp(
    `(\\*\\*|\\*|<b>|<strong>)${escapedPrice}(\\*\\*|\\*|<\\/b>|<\\/strong>)`,
    'i'
  );

  if (alreadyBoldRegex.test(copyText)) {
    return copyText;
  }

  // 2. If copyText contains plain unbolded price (e.g. "R$ 49,90"), replace it with bold "*R$ 49,90*"
  const plainPriceRegex = new RegExp(`(?<![\\*\\>\\<])${escapedPrice}(?![\\*\\<\\>])`, 'gi');
  if (plainPriceRegex.test(copyText)) {
    return copyText.replace(plainPriceRegex, `*${rawPriceStr}*`);
  }

  // 3. If price is not mentioned in copyText at all, ONLY append if explicitly requested (e.g. AI templates)
  if (appendIfMissing) {
    return `${copyText.trim()}\n\n💰 *Preço:* *${rawPriceStr}*`;
  }

  // Preserva a descrição manual original do usuário 100% intocada!
  return copyText;
}
