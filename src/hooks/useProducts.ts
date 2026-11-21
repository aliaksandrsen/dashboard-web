import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ApiProduct } from '../types/api';
import { isServerError } from '../utils/helpers';

export function useProducts(search = '') {
  const normalizedSearch = search.trim();

  return useQuery<ApiProduct[]>({
    queryKey: ['products', normalizedSearch],
    staleTime: 60_000,
    queryFn: () =>
      axios
        .get<ApiProduct[]>('/v1/products', {
          params: normalizedSearch ? { search: normalizedSearch } : undefined,
        })
        .then((res) => (Array.isArray(res.data) ? res.data : [])),
    throwOnError: isServerError,
  });
}

export function useProduct(id?: string) {
  return useQuery<ApiProduct>({
    queryKey: ['product', id],
    enabled: Boolean(id),
    queryFn: () => axios.get<ApiProduct>(`/v1/products/${id}`).then((res) => res.data),
    throwOnError: isServerError,
  });
}
