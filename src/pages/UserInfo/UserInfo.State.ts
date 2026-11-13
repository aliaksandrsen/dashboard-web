import { proxy } from 'valtio';

export const OrderStatus = {
  Pending: 'pending',
  Shipped: 'shipped',
  OutOfStock: 'out_of_stock',
} as const;

export type OrderStatusKeys = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface Order {
  id: string;
  productName: string;
  status: OrderStatusKeys;
  orderedDate: string;
  deliveryDate: string;
  totalAmount: number;
  hasBeenReviewed: boolean;
}

export const orderStore = proxy<{
  filter: OrderStatusKeys | undefined;
  orders: Order[];
}>({
  filter: undefined,
  orders: [],
});

export const updateOrders = (updatedOrders: Order[]) => {
  orderStore.orders = updatedOrders;
};

export const changeFilter = (newFilter: OrderStatusKeys | undefined) => {
  orderStore.filter = newFilter;
};
