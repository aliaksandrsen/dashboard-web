import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserInfo from '.';
import {
  type Order,
  OrderStatus,
  type UserInfoData,
  orderStore,
  userStore,
} from './UserInfo.State';

const mockUseUserInfo = vi.fn();

vi.mock('./useUserInfo', () => ({
  default: () => mockUseUserInfo(),
}));

const orderResponseData: Order[] = [
  {
    id: 'db4be77c-cd14-441a-8ae1-35e0c037a842',
    productName: 'Fancy soap',
    status: OrderStatus.Shipped,
    orderedDate: '06/24/2025',
    deliveryDate: '06/27/2025',
    totalAmount: 400,
    hasBeenReviewed: true,
  },
];

const userResponseData: UserInfoData = {
  name: 'Some Body',
  joinedDate: '10/21/2002',
  recentOrders: 2,
  newProducts: 6,
  nextDeliveryDate: '07/27/2025',
};

const ui = () => render(<UserInfo />);

describe('<UserInfo />', () => {
  beforeEach(() => {
    orderStore.orders = [];
    userStore.user = {
      name: '',
      joinedDate: '',
      recentOrders: 0,
      newProducts: 0,
      nextDeliveryDate: '',
    };

    mockUseUserInfo.mockReturnValue({
      ordersAreLoading: false,
      ordersErrors: null,
      orderData: orderResponseData,
      userIsLoading: false,
      userErrors: null,
      userData: userResponseData,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the user info screen with fetched data', async () => {
    ui();

    expect(screen.getByText('Search bar')).toBeDefined();
    expect(await screen.findByText('Some Body')).toBeDefined();
    expect(await screen.findByText('Fancy soap')).toBeDefined();
  });

  it('should render loading indicators independently for user and orders', () => {
    mockUseUserInfo.mockReturnValue({
      ordersAreLoading: true,
      ordersErrors: null,
      orderData: undefined,
      userIsLoading: true,
      userErrors: null,
      userData: undefined,
    });

    ui();

    expect(screen.getByTestId('user-loading-circle')).toBeDefined();
    expect(screen.getByTestId('orders-loading-circle')).toBeDefined();
  });

  it('should render error alert when fetching data fails', () => {
    mockUseUserInfo.mockReturnValue({
      ordersAreLoading: false,
      ordersErrors: new Error('Network error'),
      orderData: undefined,
      userIsLoading: false,
      userErrors: null,
      userData: undefined,
    });

    ui();

    expect(screen.getByRole('alert').textContent).toBe('Something went wrong');
  });
});
