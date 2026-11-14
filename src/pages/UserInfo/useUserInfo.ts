import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Order, UserInfoData } from './UserInfo.State';

function useUserInfo() {
  const {
    isLoading: ordersAreLoading,
    error: ordersErrors,
    data: orderData,
  } = useQuery<Order[]>({
    queryKey: ['orderData'],
    queryFn: () => axios.get<Order[]>('/v1/orders').then((res) => res.data),
  });

  const {
    isLoading: userIsLoading,
    error: userErrors,
    data: userData,
  } = useQuery<UserInfoData>({
    queryKey: ['userData'],
    queryFn: () => axios.get<UserInfoData>('/v1/users').then((res) => res.data),
  });

  return {
    ordersAreLoading,
    ordersErrors,
    orderData,
    userIsLoading,
    userErrors,
    userData,
  };
}

export default useUserInfo;
