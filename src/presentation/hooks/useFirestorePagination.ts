import { useState, useCallback, useRef } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { PaginationResult } from '@/core/domain/value-objects/PaginationResult';

export interface UseFirestorePaginationOptions<T> {
  fetchPage: (
    pageSize: number,
    cursor?: QueryDocumentSnapshot
  ) => Promise<PaginationResult<T>>;
  initialPageSize?: number;
}

export function useFirestorePagination<T>({
  fetchPage,
  initialPageSize = 20,
}: UseFirestorePaginationOptions<T>) {
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Pilha de seletores de cursor para navegação bidirecional (Voltar / Avançar)
  const cursorStackRef = useRef<Array<any>>([undefined]);

  const loadPage = useCallback(
    async (pageIndex: number, size: number) => {
      setLoading(true);
      try {
        const cursor = cursorStackRef.current[pageIndex - 1];
        const res = await fetchPage(size, cursor);
        setItems(res.items);
        setHasMore(res.hasMore);

        // Se houver próximo documento, salva o cursor para a próxima página se ainda não existir
        if (res.cursor && cursorStackRef.current.length <= pageIndex) {
          cursorStackRef.current[pageIndex] = res.cursor;
        }
      } catch (err) {
        console.warn('[useFirestorePagination] Erro ao carregar página:', err);
        setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [fetchPage]
  );

  const resetPagination = useCallback(async () => {
    cursorStackRef.current = [undefined];
    setCurrentPage(1);
    await loadPage(1, pageSize);
  }, [loadPage, pageSize]);

  const nextPage = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextPageIndex = currentPage + 1;
    setCurrentPage(nextPageIndex);
    await loadPage(nextPageIndex, pageSize);
  }, [hasMore, loading, currentPage, loadPage, pageSize]);

  const prevPage = useCallback(async () => {
    if (currentPage <= 1 || loading) return;
    const prevPageIndex = currentPage - 1;
    setCurrentPage(prevPageIndex);
    await loadPage(prevPageIndex, pageSize);
  }, [currentPage, loading, loadPage, pageSize]);

  const changePageSize = useCallback(
    async (newSize: number) => {
      setPageSize(newSize);
      cursorStackRef.current = [undefined];
      setCurrentPage(1);
      await loadPage(1, newSize);
    },
    [loadPage]
  );

  return {
    items,
    currentPage,
    pageSize,
    hasMore,
    loading,
    isFirstPage: currentPage === 1,
    nextPage,
    prevPage,
    changePageSize,
    resetPagination,
    setItems,
  };
}
