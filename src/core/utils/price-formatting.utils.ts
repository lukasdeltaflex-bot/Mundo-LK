/**
 * Price Formatting Utilities for Offer Copies & Descriptions
 * Ensures product price is ALWAYS rendered in bold across Markdown, WhatsApp & HTML.
 */

export function ensurePriceBoldInCopy(
  copyText: string,
  formattedPrice: string
): string {
  if (!copyText || !copyText.trim()) {
    return formattedPrice ? `💰 *Preço:* *${formattedPrice}*` : '';
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

  // 3. If price is not mentioned in copyText at all, append price line in bold
  return `${copyText.trim()}\n\n💰 *Preço:* *${rawPriceStr}*`;
}
