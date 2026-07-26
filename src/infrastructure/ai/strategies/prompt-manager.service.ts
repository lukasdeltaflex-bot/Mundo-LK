import { IPromptManager } from '../../../core/domain/ports/ai/IPromptManager';
import { PromptTemplate } from '../../../core/domain/entities/prompt-template.entity';

/**
 * Concrete Prompt Manager Service.
 * Centralizes and versions all AI Prompts.
 */
export class PromptManagerService implements IPromptManager {
  private static instance: PromptManagerService;
  private prompts: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.seedDefaultPrompts();
  }

  public static getInstance(): PromptManagerService {
    if (!PromptManagerService.instance) {
      PromptManagerService.instance = new PromptManagerService();
    }
    return PromptManagerService.instance;
  }

  private seedDefaultPrompts(): void {
    const whatsappPrompt = new PromptTemplate({
      id: 'prompt_wa_v1',
      name: 'WhatsApp Copywriter',
      version: '1.0',
      description: 'Gera ofertas persuasivas com negritos nativos para grupos de WhatsApp',
      objective: 'Converter cliques imediatos em grupos de ofertas',
      recommendedModel: 'gemini-2.5-flash',
      language: 'pt-BR',
      systemPrompt: 'Você é um especialista em copywriting de alta conversão para afiliados no WhatsApp.',
      userPromptTemplate: 'Gere um texto chamativo com emojis e negrito (*texto*) para o produto: {{title}}. Preço: {{price}}. Link: {{link}}',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.prompts.set(`${whatsappPrompt.name}_${whatsappPrompt.version}`, whatsappPrompt);
    this.prompts.set(whatsappPrompt.name, whatsappPrompt);
  }

  public async getPrompt(name: string, version: string = '1.0'): Promise<PromptTemplate> {
    const key = `${name}_${version}`;
    const found = this.prompts.get(key) || this.prompts.get(name);
    if (!found) {
      throw new Error(`Prompt template not found: ${name} (v${version})`);
    }
    return found;
  }

  public async renderPrompt(templateName: string, variables: Record<string, string>): Promise<string> {
    const prompt = await this.getPrompt(templateName);
    let rendered = prompt.userPromptTemplate;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return rendered;
  }
}
