export interface PaginationResult<T> {
  items: T[];
  cursor?: unknown;
  hasMore: boolean;
  totalCount?: number;
}
