export interface ApiProduct {
  id: string;
  name: string;
  price: number;
  stripeProductId: string | null;
  stripePriceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOrder {
  id: number;
  total: number;
  stripeInvoiceId: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number | null;
  user?: ApiUser | null;
  products?: ApiProduct[];
}

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  address: string;
  orders?: ApiOrder[];
}

export interface StripeSyncResponse {
  message: string;
  result: {
    processed: number;
    created: number;
    skipped: number;
  };
}

export interface StripeCheckoutResponse {
  sessionId: string;
  url: string;
}

export interface FlashMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}
