export interface CategoryProps {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string;
}

export class Category {
  public readonly id: string;
  public name: string;
  public slug: string;
  public icon?: string;
  public parentId?: string;

  constructor(props: CategoryProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.icon = props.icon;
    this.parentId = props.parentId;
  }
}
