import { Offer } from '../../domain/entities/offer.entity';
import { Product } from '../../domain/entities/product.entity';

export interface ImportAndGenerateOfferInputDTO {
  url: string;
  userId: string;
  affiliateTag?: string;
}

export interface ImportAndGenerateOfferOutputDTO {
  product: Product;
  offer: Offer;
}
