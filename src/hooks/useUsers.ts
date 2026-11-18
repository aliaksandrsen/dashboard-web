import { useContext } from 'react';
import { QueryClient, QueryClientContext, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type UserInfoData, normalizeUsersList } from '../pages/UserInfo/UserInfo.State';

const fallbackQueryClient = new QueryClient();

export function useUsers(search = '') {
  const contextClient = useContext(QueryClientContext);
  const hasProvider = Boolean(contextClient);

  const {
    isLoading: usersAreLoading,
    error: usersError,
    data: usersData,
    refetch: refetchUsers,
  } = useQuery<UserInfoData[]>(
    {
      queryKey: ['usersList', search],
      staleTime: 60_000,
      enabled: hasProvider,
      queryFn: () =>
        axios
          .get<unknown>('/v1/users', {
            params: search.trim() ? { search: search.trim() } : undefined,
          })
          .then((res) => normalizeUsersList(res.data)),
    },
    contextClient ?? fallbackQueryClient,
  );

  return {
    usersAreLoading,
    usersError,
    usersData,
    refetchUsers,
  };
}
