import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  type Order,
  type UserInfoData,
  normalizeOrdersData,
  normalizeUserData,
} from './UserInfo.State';

export const isServerError = (error: unknown): boolean =>
  axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500;

function useUserInfo() {
  const {
    isLoading: ordersAreLoading,
    error: ordersErrors,
    data: orderData,
    refetch: refetchOrders,
  } = useQuery<Order[]>({
    queryKey: ['orderData'],
    staleTime: 300_000,
    gcTime: 3_600_000,
    queryFn: () => axios.get<unknown>('/v1/orders').then((res) => normalizeOrdersData(res.data)),
    throwOnError: isServerError,
  });

  const {
    isLoading: userIsLoading,
    error: userErrors,
    data: userData,
    refetch: refetchUser,
  } = useQuery<UserInfoData>({
    queryKey: ['userData'],
    staleTime: 300_000,
    gcTime: 3_600_000,
    queryFn: () => axios.get<unknown>('/v1/users').then((res) => normalizeUserData(res.data)),
    throwOnError: isServerError,
  });

  return {
    ordersAreLoading,
    ordersErrors,
    orderData,
    refetchOrders,
    userIsLoading,
    userErrors,
    userData,
    refetchUser,
  };
}

export default useUserInfo;
