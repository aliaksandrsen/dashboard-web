import { fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UserInfo from '.';
import {
  type Order,
  OrderStatus,
  type UserInfoData,
  orderStore,
  productStore,
  userStore,
} from './UserInfo.State';

const mockUseUserInfo = vi.fn();
const mockRefetchOrders = vi.fn();
const mockRefetchUser = vi.fn();

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
    orderStore.filter = undefined;
    orderStore.searchQuery = '';
    productStore.products = [];
    productStore.search = '';
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
      refetchOrders: mockRefetchOrders,
      userIsLoading: false,
      userErrors: null,
      userData: userResponseData,
      refetchUser: mockRefetchUser,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the user info screen with Header, summary metrics, orders table, and sidebar previews', async () => {
    ui();

    expect(screen.getByPlaceholderText('Search products...')).toBeDefined();
    expect(await screen.findByText('Some Body')).toBeDefined();
    expect(await screen.findByText('Customer since 2002')).toBeDefined();

    const ordersTable = await screen.findByRole('table', { name: 'orders-table' });
    expect(within(ordersTable).getByText('Fancy soap')).toBeDefined();

    expect(screen.getByText('In the last 30 days,')).toBeDefined();
    expect(screen.getByText('orders made')).toBeDefined();
    expect(screen.getByText('New products')).toBeDefined();
    expect(screen.getByText('Next delivery date')).toBeDefined();
    expect(screen.getByText('Recent orders')).toBeDefined();
    expect(screen.getByText('Related products')).toBeDefined();
  });

  it('should render loading indicators independently for user and orders', () => {
    mockUseUserInfo.mockReturnValue({
      ordersAreLoading: true,
      ordersErrors: null,
      orderData: undefined,
      refetchOrders: mockRefetchOrders,
      userIsLoading: true,
      userErrors: null,
      userData: undefined,
      refetchUser: mockRefetchUser,
    });

    ui();

    expect(screen.getByTestId('user-loading-circle')).toBeDefined();
    expect(screen.getByTestId('orders-loading-circle')).toBeDefined();
  });

  it('should render isolated error alert with retry when orders fail while keeping Header functional', async () => {
    mockUseUserInfo.mockReturnValue({
      ordersAreLoading: false,
      ordersErrors: new Error('Network error'),
      orderData: undefined,
      refetchOrders: mockRefetchOrders,
      userIsLoading: false,
      userErrors: null,
      userData: userResponseData,
      refetchUser: mockRefetchUser,
    });

    ui();

    expect(await screen.findByText('Some Body')).toBeDefined();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Failed to load orders');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mockRefetchOrders).toHaveBeenCalledTimes(1);
  });

  it('should render isolated error alert with retry when user info fails while keeping orders visible', async () => {
    mockUseUserInfo.mockReturnValue({
      ordersAreLoading: false,
      ordersErrors: null,
      orderData: orderResponseData,
      refetchOrders: mockRefetchOrders,
      userIsLoading: false,
      userErrors: new Error('Network error'),
      userData: undefined,
      refetchUser: mockRefetchUser,
    });

    ui();

    const ordersTable = await screen.findByRole('table', { name: 'orders-table' });
    expect(within(ordersTable).getByText('Fancy soap')).toBeDefined();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Failed to load user info');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mockRefetchUser).toHaveBeenCalledTimes(1);
  });

  it('should have no axe accessibility violations', async () => {
    const { container } = ui();
    await screen.findByText('Some Body');

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
