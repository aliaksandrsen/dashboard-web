import { beforeEach, describe, expect, it } from 'vitest';
import {
  OrderStatus,
  addOrderToStore,
  changeFilter,
  changeOrderSearch,
  changeProductSearch,
  createFallbackOrder,
  normalizeOrdersData,
  normalizeProductsData,
  normalizeUserData,
  normalizeUsersList,
  orderStore,
  productStore,
  removeOrderFromStore,
  setActiveUser,
  updateOrderStatusInStore,
  updateOrders,
  updateProducts,
  updateUser,
  updateUsersList,
  userStore,
} from './UserInfo.State';

describe('UserInfo.State', () => {
  beforeEach(() => {
    orderStore.orders = [];
    orderStore.filter = undefined;
    orderStore.searchQuery = '';
    userStore.users = [];
    userStore.activeUserId = undefined;
    userStore.user = {
      id: undefined,
      name: '',
      email: '',
      address: '',
      joinedDate: '',
      recentOrders: 0,
      newProducts: 0,
      nextDeliveryDate: '',
    };
    productStore.products = [];
    productStore.search = '';
  });

  it('normalizes backend orders across shipped, pending, and out-of-stock edge cases', () => {
    expect(normalizeOrdersData(null)).toEqual([]);

    const normalized = normalizeOrdersData([
      {
        id: 2,
        total: 150,
        stripeInvoiceId: null,
        createdAt: '2025-07-01T12:00:00.000Z',
        updatedAt: '2025-07-02T12:00:00.000Z',
        userId: 1,
        user: { id: 1, name: 'Alice', email: 'a@b.com', address: 'Main' },
        products: [],
      },
      {
        id: 4,
        total: 0,
        stripeInvoiceId: null,
        createdAt: '2025-07-01T12:00:00.000Z',
      },
      {
        id: 6,
        total: 80,
        stripeInvoiceId: 'in_999',
        products: [{ id: 'p-1', name: 'Desk', price: 80 }],
      },
    ]);

    expect(normalized[0].productName).toBe('Order #2');
    expect(normalized[0].status).toBe(OrderStatus.Pending);
    expect(normalized[0].userName).toBe('Alice');
    expect(normalized[1].status).toBe(OrderStatus.OutOfStock);
    expect(normalized[2].status).toBe(OrderStatus.Shipped);
    expect(normalized[2].productName).toBe('Desk');
    expect(normalized[2].productIds).toEqual(['p-1']);
  });

  it('normalizes empty, single, and list user payloads', () => {
    expect(normalizeUserData(null).id).toBeUndefined();
    expect(normalizeUserData([]).id).toBeUndefined();
    expect(normalizeUsersList(null)).toEqual([]);

    const users = normalizeUsersList([
      {
        id: 10,
        name: 'Bob',
        email: 'bob@test.com',
        address: '10 Oak',
        orders: [{ id: 1, total: 50, createdAt: '2025-08-01T00:00:00.000Z' }],
      },
    ]);
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(10);
    expect(users[0].recentOrders).toBe(1);
    expect(users[0].nextDeliveryDate).not.toBe('');
  });

  it('normalizes backend products list', () => {
    expect(normalizeProductsData('invalid')).toEqual([]);
    const products = normalizeProductsData([
      { id: 'u1', name: 'Lamp', price: 29.99, stripeProductId: 'prod_1' },
    ]);
    expect(products[0].id).toBe('u1');
    expect(products[0].price).toBe(29.99);
    expect(products[0].stockLeft).toBeTypeOf('number');
  });

  it('mutates orderStore, userStore, and productStore via store actions', () => {
    const order = createFallbackOrder('Chair', 99);
    updateOrders([order]);
    expect(orderStore.orders).toHaveLength(1);

    changeFilter(OrderStatus.Pending);
    changeOrderSearch('Chair');
    expect(orderStore.filter).toBe(OrderStatus.Pending);
    expect(orderStore.searchQuery).toBe('Chair');

    updateOrderStatusInStore(order.id, OrderStatus.Shipped);
    expect(orderStore.orders[0].status).toBe(OrderStatus.Shipped);

    const added = createFallbackOrder('Table', 199);
    addOrderToStore(added);
    expect(orderStore.orders).toHaveLength(2);

    removeOrderFromStore(order.id);
    expect(orderStore.orders).toHaveLength(1);

    const userA = {
      id: 1,
      name: 'User A',
      joinedDate: '2025-01-01',
      recentOrders: 1,
      newProducts: 0,
      nextDeliveryDate: '',
    };
    const userB = { ...userA, id: 2, name: 'User B' };

    updateUsersList([userA, userB]);
    expect(userStore.activeUserId).toBe(1);
    setActiveUser(2);
    expect(userStore.user.name).toBe('User B');
    updateUser({ ...userA, name: 'User A Edited' });
    expect(userStore.activeUserId).toBe(1);

    updateProducts([{ id: 'p1', name: 'Book', price: 20 }]);
    changeProductSearch('Book');
    expect(productStore.products).toHaveLength(1);
    expect(productStore.search).toBe('Book');
  });
});
