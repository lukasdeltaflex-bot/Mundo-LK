import { AIContextBuilder } from '@/infrastructure/ai/services/AIContextBuilder';

export interface OptimizedPromptResult {
  finalPrompt: string;
  techniqueUsed: string;
  promptHash: string;
}

export class PromptOptimizerService {
  /**
   * Optimizes context into final prompt applying Few-Shot, CoT or Direct Output directives
   */
  public static optimizePrompt(rawContextBlock: string, technique: 'few-shot' | 'cot' | 'direct' = 'few-shot'): OptimizedPromptResult {
    let finalPrompt = rawContextBlock;

    if (technique === 'few-shot') {
      finalPrompt += `\n\nEXEMPLO DE RESPOSTA ESPERADA EM JSON PURO:
{
  "publicoAlvo": "Exemplo de público",
  "whatsAppText": "Copy de alto impacto com link",
  "cta": "Garanta o seu!",
  "scoreValue": 95
}`;
    } else if (technique === 'cot') {
      finalPrompt += `\n\nINSTRUÇÃO DE PENSAMENTO (Chain-of-Thought):
Pense no ângulo mais persuasivo antes de redigir o JSON final.`;
    }

    // Hash simples para rastreabilidade de auditoria
    const promptHash = Buffer.from(finalPrompt.slice(0, 200)).toString('hex').slice(0, 16);

    return {
      finalPrompt,
      techniqueUsed: technique,
      promptHash,
    };
  }
}
