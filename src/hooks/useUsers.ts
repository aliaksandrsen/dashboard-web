import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { ApiUser } from '../types/api';
import { isServerError } from '../utils/helpers';

export function useUsers(search = '') {
  const normalizedSearch = search.trim();

  return useQuery<ApiUser[]>({
    queryKey: ['users', normalizedSearch],
    staleTime: 60_000,
    queryFn: () =>
      axios
        .get<ApiUser[]>('/v1/users', {
          params: normalizedSearch ? { search: normalizedSearch } : undefined,
        })
        .then((res) => (Array.isArray(res.data) ? res.data : [])),
    throwOnError: isServerError,
  });
}

export function useUser(id?: string) {
  return useQuery<ApiUser>({
    queryKey: ['user', id],
    enabled: Boolean(id),
    queryFn: () => axios.get<ApiUser>(`/v1/users/${id}`).then((res) => res.data),
    throwOnError: isServerError,
  });
}
