export interface SearchQuery {
  term: string;
  category?: string;
  marketplace?: string;
  limit?: number;
}

export interface ISearchEngine<T = unknown> {
  search(query: SearchQuery): Promise<T[]>;
  index(id: string, document: T): Promise<void>;
  removeFromIndex(id: string): Promise<void>;
}
