import { MarketplaceConnectionSlug } from '../entities/marketplace-connection.entity';
import { MarketplaceHealthProps } from '../entities/marketplace-health.entity';

/**
 * IMarketplaceHealthProvider — Interface para Diagnóstico de Saúde dos Canais (Release 2.2.8)
 *
 * Permite que o MarketplaceHealthService e futuros motores (Release 2.3 / 2.4)
 * consultem a saúde de qualquer marketplace sem acoplamento a APIs específicas.
 */
export interface IMarketplaceHealthProvider {
  marketplaceSlug: MarketplaceConnectionSlug;
  checkHealth(userId: string): Promise<MarketplaceHealthProps>;
}
