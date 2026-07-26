export type PromptStatus = 'ACTIVE' | 'DEPRECATED';

export interface PromptTemplateProps {
  id: string;
  name: string;
  version: string;
  description: string;
  objective: string;
  recommendedModel: string;
  language: string;
  systemPrompt: string;
  userPromptTemplate: string;
  status: PromptStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class PromptTemplate {
  public readonly id: string;
  public name: string;
  public version: string;
  public description: string;
  public objective: string;
  public recommendedModel: string;
  public language: string;
  public systemPrompt: string;
  public userPromptTemplate: string;
  public status: PromptStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: PromptTemplateProps) {
    this.id = props.id;
    this.name = props.name;
    this.version = props.version;
    this.description = props.description;
    this.objective = props.objective;
    this.recommendedModel = props.recommendedModel;
    this.language = props.language;
    this.systemPrompt = props.systemPrompt;
    this.userPromptTemplate = props.userPromptTemplate;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
