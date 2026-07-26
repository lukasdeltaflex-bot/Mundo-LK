import { PromptTemplate } from '../../../core/domain/entities/prompt-template.entity';

export interface FirestorePromptDoc {
  id: string;
  name: string;
  version: string;
  description: string;
  objective: string;
  recommendedModel: string;
  language: string;
  systemPrompt: string;
  userPromptTemplate: string;
  status: 'ACTIVE' | 'DEPRECATED';
  createdAt: string;
  updatedAt: string;
}

export class PromptMapper {
  public static toDomain(doc: FirestorePromptDoc): PromptTemplate {
    return new PromptTemplate({
      id: doc.id,
      name: doc.name,
      version: doc.version,
      description: doc.description,
      objective: doc.objective,
      recommendedModel: doc.recommendedModel,
      language: doc.language,
      systemPrompt: doc.systemPrompt,
      userPromptTemplate: doc.userPromptTemplate,
      status: doc.status,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  public static toPersistence(entity: PromptTemplate): FirestorePromptDoc {
    return {
      id: entity.id,
      name: entity.name,
      version: entity.version,
      description: entity.description,
      objective: entity.objective,
      recommendedModel: entity.recommendedModel,
      language: entity.language,
      systemPrompt: entity.systemPrompt,
      userPromptTemplate: entity.userPromptTemplate,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
