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
  productIds?: readonly string[];
  status: OrderStatusKeys;
  orderedDate: string;
  deliveryDate: string;
  totalAmount: number;
  hasBeenReviewed: boolean;
  userId?: number | null;
  userName?: string;
  stripeInvoiceId?: string | null;
}

export interface UserInfoData {
  id?: number;
  name: string;
  email?: string;
  address?: string;
  joinedDate: string;
  recentOrders: number;
  newProducts: number;
  nextDeliveryDate: string;
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  stripeProductId?: string | null;
  stockLeft?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  stripeProductId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendOrder {
  id: number;
  total: number;
  stripeInvoiceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  userId?: number | null;
  user?: BackendUser | null;
  products?: BackendProduct[];
}

export interface BackendUser {
  id: number;
  email: string;
  name: string;
  address: string;
  orders?: BackendOrder[];
}

const formatToUsDate = (dateInput?: string | Date): string => {
  if (!dateInput) {
    return '';
  }
  const parsed = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) {
    return typeof dateInput === 'string' ? dateInput : '';
  }
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${month}/${day}/${year}`;
};

const addDaysToUsDate = (dateInput?: string, days = 3): string => {
  if (!dateInput) {
    return '';
  }
  const base = new Date(dateInput);
  if (Number.isNaN(base.getTime())) {
    return '';
  }
  base.setDate(base.getDate() + days);
  return formatToUsDate(base);
};

const isFrontendOrder = (item: unknown): item is Order =>
  typeof item === 'object' &&
  item !== null &&
  'productName' in item &&
  'status' in item &&
  'totalAmount' in item;

const isFrontendUser = (item: unknown): item is UserInfoData =>
  typeof item === 'object' &&
  item !== null &&
  'joinedDate' in item &&
  'recentOrders' in item &&
  'nextDeliveryDate' in item;

export const normalizeOrdersData = (raw: unknown): Order[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    if (isFrontendOrder(item)) {
      return item;
    }
    const backendOrder = item as BackendOrder;
    const numericId = Number(backendOrder.id);
    const total = typeof backendOrder.total === 'number' ? backendOrder.total : 0;
    const products = Array.isArray(backendOrder.products) ? backendOrder.products : [];
    const productName =
      products.length > 0
        ? products.map((product) => product.name).join(', ')
        : `Order #${backendOrder.id}`;

    let status: OrderStatusKeys = OrderStatus.Pending;
    if (total <= 0) {
      status = OrderStatus.OutOfStock;
    } else if (backendOrder.stripeInvoiceId) {
      status = OrderStatus.Shipped;
    } else if (!Number.isNaN(numericId) && numericId % 2 === 1) {
      status = OrderStatus.Shipped;
    }

    const orderedDate = formatToUsDate(backendOrder.createdAt);
    const deliveryDate = addDaysToUsDate(backendOrder.updatedAt ?? backendOrder.createdAt, 3);

    return {
      id: String(backendOrder.id),
      productName,
      productIds: products.map((product) => product.id),
      status,
      orderedDate,
      deliveryDate,
      totalAmount: total,
      hasBeenReviewed: Boolean(
        backendOrder.stripeInvoiceId || (!Number.isNaN(numericId) && numericId % 2 === 1),
      ),
      userId: backendOrder.userId ?? null,
      userName: backendOrder.user?.name,
      stripeInvoiceId: backendOrder.stripeInvoiceId ?? null,
    };
  });
};

const mapBackendUser = (backendUser: BackendUser): UserInfoData => {
  const userOrders = Array.isArray(backendUser.orders) ? backendUser.orders : [];
  const latestOrderDate = userOrders[0]?.createdAt;

  return {
    id: backendUser.id,
    name: backendUser.name ?? '',
    email: backendUser.email ?? '',
    address: backendUser.address ?? '',
    joinedDate: latestOrderDate ?? '2025-01-01',
    recentOrders: userOrders.length,
    newProducts: 0,
    nextDeliveryDate: addDaysToUsDate(latestOrderDate, 5),
  };
};

export const normalizeUserData = (raw: unknown): UserInfoData => {
  const emptyUser: UserInfoData = {
    id: undefined,
    name: '',
    email: '',
    address: '',
    joinedDate: '',
    recentOrders: 0,
    newProducts: 0,
    nextDeliveryDate: '',
  };

  if (!raw) {
    return emptyUser;
  }

  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (!candidate) {
    return emptyUser;
  }

  if (isFrontendUser(candidate)) {
    return candidate;
  }

  return mapBackendUser(candidate as BackendUser);
};

export const normalizeUsersList = (raw: unknown): UserInfoData[] => {
  if (!raw) {
    return [];
  }
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((item) => (isFrontendUser(item) ? item : mapBackendUser(item as BackendUser)));
};

export const normalizeProductsData = (raw: unknown): ProductItem[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item, idx) => {
    const prod = item as BackendProduct & { stockLeft?: number };
    const deterministicStock = ((idx * 17 + prod.name.length * 7) % 45) + 3;
    return {
      id: String(prod.id),
      name: prod.name,
      price: typeof prod.price === 'number' ? prod.price : 0,
      description: prod.description,
      stripeProductId: prod.stripeProductId ?? null,
      stockLeft: prod.stockLeft ?? deterministicStock,
      createdAt: prod.createdAt,
      updatedAt: prod.updatedAt,
    };
  });
};

export const orderStore = proxy<{
  filter: OrderStatusKeys | undefined;
  searchQuery: string;
  orders: Order[];
}>({
  filter: undefined,
  searchQuery: '',
  orders: [],
});

export const userStore = proxy<{
  user: UserInfoData;
  users: UserInfoData[];
  activeUserId: number | undefined;
}>({
  user: {
    id: undefined,
    name: '',
    email: '',
    address: '',
    joinedDate: '',
    recentOrders: 0,
    newProducts: 0,
    nextDeliveryDate: '',
  },
  users: [],
  activeUserId: undefined,
});

export const productStore = proxy<{
  search: string;
  products: ProductItem[];
}>({
  search: '',
  products: [],
});

export const updateOrders = (updatedOrders: Order[]) => {
  orderStore.orders = updatedOrders;
};

export const changeFilter = (newFilter: OrderStatusKeys | undefined) => {
  orderStore.filter = newFilter;
};

export const changeOrderSearch = (query: string) => {
  orderStore.searchQuery = query;
};

export const updateOrderStatusInStore = (orderId: string, nextStatus: OrderStatusKeys) => {
  orderStore.orders = orderStore.orders.map((order) =>
    order.id === orderId ? { ...order, status: nextStatus } : order,
  );
};

export const removeOrderFromStore = (orderId: string) => {
  orderStore.orders = orderStore.orders.filter((order) => order.id !== orderId);
};

export const addOrderToStore = (newOrder: Order) => {
  orderStore.orders = [newOrder, ...orderStore.orders];
};

export const createFallbackOrder = (productName: string, totalAmount: number): Order => {
  const now = new Date();
  const formatted = now.toLocaleDateString('en-US');
  return {
    id: String(now.getTime()),
    productName,
    status: OrderStatus.Pending,
    orderedDate: formatted,
    deliveryDate: formatted,
    totalAmount,
    hasBeenReviewed: false,
  };
};

export const updateUser = (updatedUser: UserInfoData) => {
  userStore.user = updatedUser;
  if (updatedUser.id !== undefined) {
    userStore.activeUserId = updatedUser.id;
  }
};

export const updateUsersList = (users: UserInfoData[]) => {
  userStore.users = users;
  if (users.length === 0) {
    return;
  }
  const currentActive = users.find((u) => u.id === userStore.activeUserId);
  const selected = currentActive ?? users[0];
  userStore.user = selected;
  userStore.activeUserId = selected.id;
};

export const setActiveUser = (userId: number) => {
  userStore.activeUserId = userId;
  const found = userStore.users.find((u) => u.id === userId);
  if (found) {
    userStore.user = found;
  }
};

export const updateProducts = (updatedProducts: ProductItem[]) => {
  productStore.products = updatedProducts;
};

export const changeProductSearch = (query: string) => {
  productStore.search = query;
};
