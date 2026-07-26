import { PRODUCT_CATEGORIES, ProductCategoryType } from '../entities/category.entity';

export class CategorySuggesterService {
  public static suggestCategory(title: string, description: string = ''): ProductCategoryType {
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('iphone') || text.includes('galaxy') || text.includes('celular') || text.includes('smartphone') || text.includes('xiaomi')) {
      return 'Celulares';
    }
    if (text.includes('notebook') || text.includes('pc') || text.includes('computador') || text.includes('teclado') || text.includes('mouse') || text.includes('monitor')) {
      return 'Informática';
    }
    if (text.includes('air fryer') || text.includes('fritadeira') || text.includes('panela') || text.includes('cafeteira') || text.includes('liquidificador') || text.includes('fogao')) {
      return 'Cozinha';
    }
    if (text.includes('tv') || text.includes('smart tv') || text.includes('sofa') || text.includes('cama') || text.includes('quadro') || text.includes('aspirador')) {
      return 'Casa e Decoração';
    }
    if (text.includes('perfume') || text.includes('fragrancia') || text.includes('eau de')) {
      return 'Perfumes';
    }
    if (text.includes('maquiagem') || text.includes('batom') || text.includes('skincare') || text.includes('creme') || text.includes('shampoo')) {
      return 'Beleza';
    }
    if (text.includes('fone') || text.includes('headset') || text.includes('playstation') || text.includes('xbox') || text.includes('nintendo') || text.includes('game') || text.includes('gamer')) {
      return 'Games';
    }
    if (text.includes('camisa') || text.includes('camiseta') || text.includes('vestido') || text.includes('tenis') || text.includes('sapato') || text.includes('calca')) {
      return 'Moda Feminina';
    }
    if (text.includes('racoa') || text.includes('pet') || text.includes('cachorro') || text.includes('gato')) {
      return 'Pet';
    }
    if (text.includes('furadeira') || text.includes('parafusadeira') || text.includes('ferramenta')) {
      return 'Ferramentas';
    }
    if (text.includes('pneu') || text.includes('carro') || text.includes('moto') || text.includes('capacete')) {
      return 'Automotivo';
    }
    if (text.includes('livro') || text.includes('hq') || text.includes('manga')) {
      return 'Livros';
    }

    return 'Eletrônicos';
  }
}
