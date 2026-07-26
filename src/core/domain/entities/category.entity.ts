export const PRODUCT_CATEGORIES = [
  'Eletrônicos',
  'Informática',
  'Celulares',
  'Casa e Decoração',
  'Cozinha',
  'Moda Feminina',
  'Moda Masculina',
  'Beleza',
  'Perfumes',
  'Saúde',
  'Esportes',
  'Infantil',
  'Bebês',
  'Pet',
  'Automotivo',
  'Games',
  'Ferramentas',
  'Livros',
  'Marketplace',
  'Outros',
] as const;

export type ProductCategoryType = (typeof PRODUCT_CATEGORIES)[number];

export interface CategoryProps {
  id: string;
  name: ProductCategoryType | string;
  slug: string;
  description?: string;
  iconName?: string;
}

export class Category {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;
  public readonly description: string;
  public readonly iconName: string;

  constructor(props: CategoryProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug || props.name.toLowerCase().replace(/\s+/g, '-');
    this.description = props.description || `Categoria de ${props.name}`;
    this.iconName = props.iconName || 'Tag';
  }
}
