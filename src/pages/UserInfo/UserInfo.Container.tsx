import { useContext, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import { QueryClientContext } from '@tanstack/react-query';
import axios from 'axios';
import { ErrorBoundary } from 'react-error-boundary';
import styled from 'styled-components';
import { useSnapshot } from 'valtio';
import { ErrorFallback } from '../../components/ErrorFallbacks';
import Header from '../../components/Header';
import OrdersTable from '../../components/OrdersTable';
import SafeLink from '../../components/SafeLink';
import { useProducts } from '../../hooks/useProducts';
import { useSafeNavigate } from '../../hooks/useSafeNavigate';
import { formatCurrency, formatShortDate, logError } from '../../utils/helpers';
import {
  type Order,
  changeFilter,
  changeOrderSearch,
  changeProductSearch,
  orderStore,
  productStore,
  removeOrderFromStore,
  updateOrders,
  updateProducts,
  updateUser,
  userStore,
} from './UserInfo.State';
import useUserInfo from './useUserInfo';

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 24px;
  align-items: start;
  padding-bottom: 32px;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
`;

const SideColumn = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SummarySection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const SummaryHeading = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const MetricCard = styled.article<{ $hideOnMobile?: boolean }>`
  background: linear-gradient(125deg, #27272a 0%, #18181b 55%, #27272a 100%);
  color: #ffffff;
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-height: 92px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  @media (max-width: 600px) {
    ${({ $hideOnMobile }) => ($hideOnMobile ? 'display: none;' : '')}
  }
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
`;

const MetricLabel = styled.div`
  font-size: 0.8125rem;
  color: #d4d4d8;
`;

const SideCard = styled.section`
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const SideCardTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  text-align: center;
`;

const SideList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SideListItem = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: #374151;
`;

const SideItemLink = styled(SafeLink)`
  font-weight: 600;
  color: #111827;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
    color: #0b57d0;
  }
`;

const SideItemMeta = styled.span`
  color: #6b7280;
  font-size: 0.75rem;
`;

const SideItemPrice = styled.span`
  font-weight: 600;
  color: #111827;
`;

const CardActionWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 4px;
`;

const ActionLinkButton = styled(SafeLink)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 18px;
  border-radius: 6px;
  background-color: #6b7280;
  color: #ffffff;
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 600;

  &:hover,
  &:focus-visible {
    background-color: #4b5563;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const CardActionButton = styled.button`
  padding: 8px 18px;
  border: 0;
  border-radius: 6px;
  background-color: #6b7280;
  color: #ffffff;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background-color: #4b5563;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const UserInfo = () => {
  const orderSnap = useSnapshot(orderStore);
  const userSnap = useSnapshot(userStore);
  const productSnap = useSnapshot(productStore);
  const ordersTableSectionRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useContext(QueryClientContext);
  const safeNavigate = useSafeNavigate();
  const [actionAlert, setActionAlert] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    orderData,
    ordersAreLoading,
    ordersErrors,
    refetchOrders,
    userData,
    userIsLoading,
    userErrors,
    refetchUser,
  } = useUserInfo();

  const { productsData } = useProducts(productSnap.search);

  useEffect(() => {
    if (orderData) {
      updateOrders(orderData);
    }
  }, [orderData]);

  useEffect(() => {
    if (userData) {
      updateUser(userData);
    }
  }, [userData]);

  useEffect(() => {
    if (productsData) {
      updateProducts(productsData);
    }
  }, [productsData]);

  const onSubmitProductSearch = (searchText: string) => {
    changeProductSearch(searchText);
    safeNavigate('/products');
  };

  const handleViewAllOrders = () => {
    changeFilter(undefined);
    changeOrderSearch('');
    ordersTableSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteOrder = async (order: Order) => {
    setActionAlert(null);
    const numericId = Number(order.id);
    try {
      if (!Number.isNaN(numericId) && numericId > 0) {
        await axios.delete(`/v1/orders/${numericId}`);
      }
      removeOrderFromStore(order.id);
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      setActionAlert({ type: 'success', text: `Order #${order.id} deleted.` });
    } catch {
      setActionAlert({ type: 'error', text: `Failed to delete order #${order.id}.` });
    }
  };

  const recentOrdersPreview = orderSnap.orders.slice(0, 3);
  const relatedProductsPreview = productSnap.products.slice(0, 3);
  const ordersCountDisplay =
    orderSnap.orders.length > 0 ? orderSnap.orders.length : userSnap.user.recentOrders;
  const productsCountDisplay =
    productSnap.products.length > 0 ? productSnap.products.length : userSnap.user.newProducts;
  const nextDateDisplay =
    userSnap.user.nextDeliveryDate || orderSnap.orders[0]?.deliveryDate || 'No upcoming';

  const renderUserSection = () => {
    if (userIsLoading) {
      return <CircularProgress data-testid="user-loading-circle" />;
    }
    if (userErrors) {
      return (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => refetchUser()}>
              Retry
            </Button>
          }
        >
          Failed to load user info
        </Alert>
      );
    }
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
        <Header
          userName={userSnap.user.name}
          joinedDate={userSnap.user.joinedDate}
          onSubmitSearch={onSubmitProductSearch}
        />
      </ErrorBoundary>
    );
  };

  const renderOrdersSection = () => {
    if (ordersAreLoading) {
      return <CircularProgress color="secondary" data-testid="orders-loading-circle" />;
    }
    if (ordersErrors) {
      return (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => refetchOrders()}>
              Retry
            </Button>
          }
        >
          Failed to load orders
        </Alert>
      );
    }
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
        <DashboardGrid>
          <MainColumn>
            {actionAlert && (
              <Alert
                severity={actionAlert.type}
                role={actionAlert.type === 'error' ? 'alert' : 'status'}
                onClose={() => setActionAlert(null)}
              >
                {actionAlert.text}
              </Alert>
            )}

            <SummarySection aria-label="Last 30 days summary">
              <SummaryHeaderRow>
                <SummaryHeading>In the last 30 days,</SummaryHeading>
                <ActionLinkButton to="/actions">Create New Order</ActionLinkButton>
              </SummaryHeaderRow>
              <MetricsGrid>
                <MetricCard>
                  <MetricValue>{ordersCountDisplay}</MetricValue>
                  <MetricLabel>orders made</MetricLabel>
                </MetricCard>
                <MetricCard $hideOnMobile>
                  <MetricValue>{productsCountDisplay}</MetricValue>
                  <MetricLabel>New products</MetricLabel>
                </MetricCard>
                <MetricCard>
                  <MetricValue>{nextDateDisplay}</MetricValue>
                  <MetricLabel>Next delivery date</MetricLabel>
                </MetricCard>
              </MetricsGrid>
            </SummarySection>

            <div ref={ordersTableSectionRef}>
              <OrdersTable
                orders={[...orderSnap.orders]}
                filter={orderSnap.filter}
                onFilterChange={changeFilter}
                searchQuery={orderSnap.searchQuery}
                onSearchChange={changeOrderSearch}
                onDeleteOrder={handleDeleteOrder}
              />
            </div>
          </MainColumn>

          <SideColumn aria-label="Quick previews">
            <SideCard aria-label="Recent orders summary">
              <SideCardTitle>Recent orders</SideCardTitle>
              <SideList>
                {recentOrdersPreview.length === 0 ? (
                  <li>
                    <SideItemMeta>No recent orders yet.</SideItemMeta>
                  </li>
                ) : (
                  recentOrdersPreview.map((order) => (
                    <SideListItem key={order.id}>
                      <SideItemLink to={`/orders/${order.id}`}>{order.productName}</SideItemLink>
                      <SideItemMeta>{formatShortDate(order.orderedDate)}</SideItemMeta>
                      <SideItemPrice>{formatCurrency(order.totalAmount)}</SideItemPrice>
                    </SideListItem>
                  ))
                )}
              </SideList>
              <CardActionWrapper>
                <CardActionButton type="button" onClick={handleViewAllOrders}>
                  View all orders
                </CardActionButton>
              </CardActionWrapper>
            </SideCard>

            <SideCard aria-label="Related products summary">
              <SideCardTitle>Related products</SideCardTitle>
              <SideList>
                {relatedProductsPreview.length === 0 ? (
                  <li>
                    <SideItemMeta>No products in catalog yet.</SideItemMeta>
                  </li>
                ) : (
                  relatedProductsPreview.map((product) => (
                    <SideListItem key={product.id}>
                      <SideItemLink to={`/products/${product.id}`}>{product.name}</SideItemLink>
                      <SideItemMeta>
                        {product.stockLeft !== undefined ? `${product.stockLeft} left` : 'In stock'}
                      </SideItemMeta>
                      <SideItemPrice>{formatCurrency(product.price)}</SideItemPrice>
                    </SideListItem>
                  ))
                )}
              </SideList>
              <CardActionWrapper>
                <ActionLinkButton to="/products">View all products</ActionLinkButton>
              </CardActionWrapper>
            </SideCard>
          </SideColumn>
        </DashboardGrid>
      </ErrorBoundary>
    );
  };

  return (
    <Container component="section" maxWidth="xl">
      {renderUserSection()}
      {renderOrdersSection()}
    </Container>
  );
};

export default UserInfo;
