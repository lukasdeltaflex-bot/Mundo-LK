import { IMarketplaceAdapter } from './IMarketplaceAdapter';

export interface IMarketplaceRegistry {
  register(adapter: IMarketplaceAdapter): void;
  getAdapterForUrl(url: string): IMarketplaceAdapter;
  getAdapterBySlug(slug: string): IMarketplaceAdapter | null;
  getAllAdapters(): IMarketplaceAdapter[];
}
