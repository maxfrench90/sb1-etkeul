import { useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { metricsCollector } from '../lib/monitoring';

interface UseInfiniteScrollOptions<T> {
  queryKey: string;
  fetchFn: (page: number) => Promise<T[]>;
  pageSize?: number;
  threshold?: number;
}

export function useInfiniteScroll<T>({
  queryKey,
  fetchFn,
  pageSize = 10,
  threshold = 100
}: UseInfiniteScrollOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadStartTime = useRef<number>(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: [queryKey],
    queryFn: ({ pageParam = 1 }) => {
      loadStartTime.current = performance.now();
      return fetchFn(pageParam);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length + 1;
    },
    onSuccess: () => {
      const loadTime = performance.now() - loadStartTime.current;
      metricsCollector.recordEvent({
        type: 'performance',
        subtype: 'infinite_scroll',
        success: true,
        duration: loadTime,
        metadata: {
          queryKey,
          pageSize
        }
      });
    }
  });

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isFetchingNextPage || !hasNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < threshold;

    if (scrolledToBottom) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const items = data?.pages.flat() || [];

  return {
    containerRef,
    items,
    isLoading,
    isFetchingNextPage,
    error,
    hasNextPage
  };
}