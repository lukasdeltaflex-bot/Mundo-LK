export interface AICostEstimate {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
  estimatedCostBRL: number;
  withinBudget: boolean;
}

export class AICostControllerService {
  private static COST_PER_1K_INPUT_USD = 0.000075; // Gemini 2.5 Flash pricing
  private static COST_PER_1K_OUTPUT_USD = 0.0003;
  private static USD_TO_BRL = 5.60;
  private static MAX_PROMPT_CHARS = 12000; // Limite de proteção de tamanho de prompt

  public static estimateCost(prompt: string): AICostEstimate {
    const inputChars = prompt.length;
    const estimatedInputTokens = Math.ceil(inputChars / 4);
    const estimatedOutputTokens = 850;

    const inputCostUSD = (estimatedInputTokens / 1000) * this.COST_PER_1K_INPUT_USD;
    const outputCostUSD = (estimatedOutputTokens / 1000) * this.COST_PER_1K_OUTPUT_USD;
    const totalUSD = inputCostUSD + outputCostUSD;
    const totalBRL = totalUSD * this.USD_TO_BRL;

    const withinBudget = inputChars <= this.MAX_PROMPT_CHARS;

    return {
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCostUSD: parseFloat(totalUSD.toFixed(6)),
      estimatedCostBRL: parseFloat(totalBRL.toFixed(6)),
      withinBudget,
    };
  }

  public static enforceBudgetGuardrails(prompt: string): string {
    if (prompt.length > this.MAX_PROMPT_CHARS) {
      console.warn(`[AICostControllerService] ⚠️ Prompt excedeu o limite (${prompt.length} chars). Truncando para segurança de custos.`);
      return prompt.slice(0, this.MAX_PROMPT_CHARS);
    }
    return prompt;
  }
}
