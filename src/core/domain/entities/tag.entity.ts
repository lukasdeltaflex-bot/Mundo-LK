export interface TagProps {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export class Tag {
  public readonly id: string;
  public name: string;
  public slug: string;
  public color?: string;

  constructor(props: TagProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.color = props.color;
  }
}
