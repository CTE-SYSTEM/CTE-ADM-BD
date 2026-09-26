import { useDeferredValue } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

export const SECRETARIA_PAGE_SIZE = 20;

export const useInfiniteSecretariaList = ({
  queryKey,
  queryFn,
  search = '',
  extraParams = {},
  enabled = true,
}) => {
  const deferredSearch = useDeferredValue(search);
  const query = useInfiniteQuery({
    queryKey: [...queryKey, { search: deferredSearch, ...extraParams }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await queryFn({
        page: pageParam,
        pageSize: SECRETARIA_PAGE_SIZE,
        search: deferredSearch.trim(),
        ...extraParams,
      });
      return response?.data ?? response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (
      lastPage?.meta?.hasMore ? lastPage.meta.page + 1 : undefined
    ),
    enabled,
    staleTime: 30_000,
  });

  return {
    ...query,
    rows: query.data?.pages?.flatMap((page) => (
      Array.isArray(page?.data) ? page.data : []
    )) || [],
  };
};
