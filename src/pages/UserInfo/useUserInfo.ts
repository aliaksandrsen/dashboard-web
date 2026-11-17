import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Order, UserInfoData } from './UserInfo.State';

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
    queryFn: () => axios.get<Order[]>('/v1/orders').then((res) => res.data),
    throwOnError: isServerError,
  });

  const {
    isLoading: userIsLoading,
    error: userErrors,
    data: userData,
    refetch: refetchUser,
  } = useQuery<UserInfoData>({
    queryKey: ['userData'],
    queryFn: () => axios.get<UserInfoData>('/v1/users').then((res) => res.data),
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
