export interface DispatchChannelProps {
  id: string;
  userId: string;
  name: string;
  order?: number;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DispatchChannel {
  public readonly id: string;
  public readonly userId: string;
  public name: string;
  public order: number;
  public active: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: DispatchChannelProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.order = props.order ?? 0;
    this.active = props.active ?? true;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public updateName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }

  public updateOrder(order: number): void {
    this.order = order;
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
