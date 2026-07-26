import { PromptTemplate } from '../../entities/prompt-template.entity';

export interface IPromptRepository {
  findById(id: string): Promise<PromptTemplate | null>;
  findByNameAndVersion(name: string, version: string): Promise<PromptTemplate | null>;
  findAllActive(): Promise<PromptTemplate[]>;
  save(prompt: PromptTemplate): Promise<void>;
}
