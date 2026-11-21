import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ApiOrder } from '../types/api';
import { isServerError } from '../utils/helpers';

export function useOrders(userId?: number) {
  return useQuery<ApiOrder[]>({
    queryKey: ['orders', userId ?? 'all'],
    staleTime: 60_000,
    queryFn: () =>
      axios
        .get<ApiOrder[]>('/v1/orders', {
          params: userId !== undefined ? { userId } : undefined,
        })
        .then((res) => (Array.isArray(res.data) ? res.data : [])),
    throwOnError: isServerError,
  });
}

export function useOrder(id?: string) {
  return useQuery<ApiOrder>({
    queryKey: ['order', id],
    enabled: Boolean(id),
    queryFn: () => axios.get<ApiOrder>(`/v1/orders/${id}`).then((res) => res.data),
    throwOnError: isServerError,
  });
}
