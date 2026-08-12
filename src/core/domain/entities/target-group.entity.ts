export interface TargetGroupProps {
  id: string;
  userId: string;
  name: string;
  description?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TargetGroup {
  public readonly id: string;
  public readonly userId: string;
  public name: string;
  public description: string;
  public active: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: TargetGroupProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.description = props.description || '';
    this.active = props.active ?? true;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public updateInfo(name: string, description?: string): void {
    this.name = name;
    if (description !== undefined) this.description = description;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.active = false;
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.active = true;
    this.updatedAt = new Date();
  }
}
