import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  BadgePill,
  CardPanel,
  EmptyStateText,
  PageHeaderActions,
  PageHeaderRow,
  PageHeaderText,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  PanelTitle,
} from '../../components/ui/PagePrimitives';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { useUsers } from '../../hooks/useUsers';
import type { ApiOrder, ApiProduct, ApiUser } from '../../types/api';
import { formatCurrency, formatShortDate, getDateTimestamp } from '../../utils/helpers';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const EMPTY_ORDERS: ApiOrder[] = [];
const EMPTY_PRODUCTS: ApiProduct[] = [];
const EMPTY_USERS: ApiUser[] = [];

const MetricsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const MetricCard = styled.article`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const MetricLabel = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
`;

const MetricValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
`;

const MetricSub = styled.span`
  font-size: 0.8125rem;
  color: #64748b;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const PreviewList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PreviewRow = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
`;

const PreviewInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const PreviewLink = styled(Link)`
  font-weight: 600;
  color: #1d4ed8;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

const PreviewMeta = styled.span`
  font-size: 0.8125rem;
  color: #475569;
`;

const Dashboard = () => {
  useDocumentTitle('Dashboard');

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [mountedAt] = useState(() => Date.now());
  const [checkoutBanner, setCheckoutBanner] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(() => {
    if (searchParams.get('success') === 'true') {
      return {
        type: 'success',
        text: 'Stripe checkout completed successfully. Run Stripe sync in Settings to import the new invoice if needed.',
      };
    }
    if (searchParams.get('canceled') === 'true') {
      return {
        type: 'info',
        text: 'Stripe checkout was canceled.',
      };
    }
    return null;
  });

  const ordersQuery = useOrders();
  const productsQuery = useProducts();
  const usersQuery = useUsers();

  useEffect(() => {
    const isSuccess = searchParams.get('success') === 'true';
    const isCanceled = searchParams.get('canceled') === 'true';

    if (isSuccess) {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('success');
      setSearchParams(nextParams, { replace: true });
    } else if (isCanceled) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('canceled');
      setSearchParams(nextParams, { replace: true });
    }
  }, [queryClient, searchParams, setSearchParams]);

  const orders = ordersQuery.data ?? EMPTY_ORDERS;
  const products = productsQuery.data ?? EMPTY_PRODUCTS;
  const users = usersQuery.data ?? EMPTY_USERS;

  const metrics = useMemo(() => {
    const cutoff = mountedAt - THIRTY_DAYS_MS;
    const last30DaysOrders = orders.filter((order) => getDateTimestamp(order.createdAt) >= cutoff);
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const last30DaysRevenue = last30DaysOrders.reduce((acc, order) => acc + order.total, 0);

    return {
      totalOrders: orders.length,
      last30DaysOrdersCount: last30DaysOrders.length,
      totalRevenue,
      last30DaysRevenue,
      totalProducts: products.length,
      linkedStripeProducts: products.filter((p) => Boolean(p.stripeProductId)).length,
      totalUsers: users.length,
    };
  }, [mountedAt, orders, products, users]);

  const recentOrders = orders.slice(0, 5);
  const recentProducts = products.slice(0, 5);

  return (
    <PageWrapper>
      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Dashboard</PageTitle>
          <PageSubtitle>Overview of orders, revenue, catalog products, and customers.</PageSubtitle>
        </PageHeaderText>
        <PageHeaderActions>
          <Button component={Link} to="/orders/new" variant="contained" color="primary">
            Create Order
          </Button>
          <Button component={Link} to="/products/new" variant="outlined" color="secondary">
            Create Product
          </Button>
        </PageHeaderActions>
      </PageHeaderRow>

      {checkoutBanner && (
        <Alert severity={checkoutBanner.type} role="status" onClose={() => setCheckoutBanner(null)}>
          {checkoutBanner.text}
        </Alert>
      )}

      {ordersQuery.error && (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => void ordersQuery.refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load orders data.
        </Alert>
      )}

      {productsQuery.error && (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => void productsQuery.refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load products data.
        </Alert>
      )}

      {usersQuery.error && (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => void usersQuery.refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load users data.
        </Alert>
      )}

      <MetricsGrid aria-label="Store metrics">
        <MetricCard>
          <MetricLabel>Orders (Last 30 days)</MetricLabel>
          <MetricValue>
            {ordersQuery.isLoading ? (
              <CircularProgress size={22} aria-label="Loading orders metric" />
            ) : (
              metrics.last30DaysOrdersCount
            )}
          </MetricValue>
          <MetricSub>{metrics.totalOrders} total orders</MetricSub>
        </MetricCard>

        <MetricCard>
          <MetricLabel>Total Revenue</MetricLabel>
          <MetricValue>
            {ordersQuery.isLoading ? (
              <CircularProgress size={22} aria-label="Loading revenue metric" />
            ) : (
              formatCurrency(metrics.totalRevenue)
            )}
          </MetricValue>
          <MetricSub>{formatCurrency(metrics.last30DaysRevenue)} in last 30 days</MetricSub>
        </MetricCard>

        <MetricCard>
          <MetricLabel>Catalog Products</MetricLabel>
          <MetricValue>
            {productsQuery.isLoading ? (
              <CircularProgress size={22} aria-label="Loading products metric" />
            ) : (
              metrics.totalProducts
            )}
          </MetricValue>
          <MetricSub>{metrics.linkedStripeProducts} linked with Stripe</MetricSub>
        </MetricCard>

        <MetricCard>
          <MetricLabel>Customers</MetricLabel>
          <MetricValue>
            {usersQuery.isLoading ? (
              <CircularProgress size={22} aria-label="Loading users metric" />
            ) : (
              metrics.totalUsers
            )}
          </MetricValue>
          <MetricSub>Registered users</MetricSub>
        </MetricCard>
      </MetricsGrid>

      <PreviewGrid>
        <CardPanel aria-label="Recent orders preview">
          <PanelHeader>
            <PanelTitle>Recent Orders</PanelTitle>
            <Button component={Link} to="/orders" size="small" variant="outlined" color="secondary">
              View all orders
            </Button>
          </PanelHeader>

          {ordersQuery.isLoading ? (
            <CircularProgress size={28} data-testid="dashboard-orders-loading" />
          ) : recentOrders.length === 0 ? (
            <EmptyStateText>No orders created yet.</EmptyStateText>
          ) : (
            <PreviewList>
              {recentOrders.map((order) => (
                <PreviewRow key={order.id}>
                  <PreviewInfo>
                    <PreviewLink to={`/orders/${order.id}`}>
                      Order #{order.id}
                      {order.products && order.products.length > 0
                        ? ` — ${order.products.map((p) => p.name).join(', ')}`
                        : ''}
                    </PreviewLink>
                    <PreviewMeta>
                      {order.user?.name ?? 'Unassigned'} · {formatShortDate(order.createdAt)}
                    </PreviewMeta>
                  </PreviewInfo>
                  <strong>{formatCurrency(order.total)}</strong>
                </PreviewRow>
              ))}
            </PreviewList>
          )}
        </CardPanel>

        <CardPanel aria-label="Catalog products preview">
          <PanelHeader>
            <PanelTitle>Catalog Products</PanelTitle>
            <Button
              component={Link}
              to="/products"
              size="small"
              variant="outlined"
              color="secondary"
            >
              View all products
            </Button>
          </PanelHeader>

          {productsQuery.isLoading ? (
            <CircularProgress size={28} data-testid="dashboard-products-loading" />
          ) : recentProducts.length === 0 ? (
            <EmptyStateText>No products in catalog yet.</EmptyStateText>
          ) : (
            <PreviewList>
              {recentProducts.map((product) => (
                <PreviewRow key={product.id}>
                  <PreviewInfo>
                    <PreviewLink to={`/products/${product.id}`}>{product.name}</PreviewLink>
                    <PreviewMeta>
                      {product.stripeProductId ? (
                        <BadgePill $tone="accent">Stripe linked</BadgePill>
                      ) : (
                        <BadgePill $tone="neutral">Local only</BadgePill>
                      )}
                    </PreviewMeta>
                  </PreviewInfo>
                  <strong>{formatCurrency(product.price)}</strong>
                </PreviewRow>
              ))}
            </PreviewList>
          )}
        </CardPanel>
      </PreviewGrid>
    </PageWrapper>
  );
};

export default Dashboard;
