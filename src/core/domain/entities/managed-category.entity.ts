export interface ManagedCategoryProps {
  id: string;
  userId: string;
  name: string;
  slug?: string;
  description?: string;
  parentCategoryId?: string | null;
  active?: boolean;
  iconName?: string;
  productCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ManagedCategory {
  public readonly id: string;
  public readonly userId: string;
  public name: string;
  public slug: string;
  public description: string;
  public parentCategoryId: string | null;
  public active: boolean;
  public iconName: string;
  public productCount: number;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: ManagedCategoryProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.slug = props.slug || ManagedCategory.slugify(props.name);
    this.description = props.description || '';
    this.parentCategoryId = props.parentCategoryId || null;
    this.active = props.active ?? true;
    this.iconName = props.iconName || 'Tag';
    this.productCount = props.productCount || 0;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  }

  public isSubcategory(): boolean {
    return Boolean(this.parentCategoryId);
  }

  public updateInfo(data: {
    name?: string;
    description?: string;
    parentCategoryId?: string | null;
    active?: boolean;
    iconName?: string;
  }): void {
    if (data.name !== undefined) {
      this.name = data.name;
      this.slug = ManagedCategory.slugify(data.name);
    }
    if (data.description !== undefined) this.description = data.description;
    if (data.parentCategoryId !== undefined) this.parentCategoryId = data.parentCategoryId;
    if (data.active !== undefined) this.active = data.active;
    if (data.iconName !== undefined) this.iconName = data.iconName;
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
