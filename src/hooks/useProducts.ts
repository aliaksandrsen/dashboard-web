import { useContext } from 'react';
import { QueryClient, QueryClientContext, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type ProductItem, normalizeProductsData } from '../pages/UserInfo/UserInfo.State';

const fallbackQueryClient = new QueryClient();

export const isProductServerError = (error: unknown): boolean =>
  axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500;

export function useProducts(search = '') {
  const contextClient = useContext(QueryClientContext);
  const hasProvider = Boolean(contextClient);

  const {
    isLoading: productsAreLoading,
    error: productsError,
    data: productsData,
    refetch: refetchProducts,
  } = useQuery<ProductItem[]>(
    {
      queryKey: ['productsData', search],
      staleTime: 60_000,
      enabled: hasProvider,
      queryFn: () =>
        axios
          .get<unknown>('/v1/products', {
            params: search.trim() ? { search: search.trim() } : undefined,
          })
          .then((res) => normalizeProductsData(res.data)),
      throwOnError: isProductServerError,
    },
    contextClient ?? fallbackQueryClient,
  );

  return {
    productsAreLoading,
    productsError,
    productsData,
    refetchProducts,
  };
}
