import { PromptTemplate } from '../../entities/prompt-template.entity';

export interface IPromptManager {
  getPrompt(name: string, version?: string): Promise<PromptTemplate>;
  renderPrompt(templateName: string, variables: Record<string, string>): Promise<string>;
}
