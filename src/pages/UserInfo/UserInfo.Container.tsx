import { useEffect, useRef } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import { ErrorBoundary } from 'react-error-boundary';
import styled from 'styled-components';
import { useSnapshot } from 'valtio';
import { ErrorFallback } from '../../components/ErrorFallbacks';
import Header from '../../components/Header';
import OrdersTable from '../../components/OrdersTable';
import SafeLink from '../../components/SafeLink';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency, formatShortDate, logError } from '../../utils/helpers';
import {
  type ProductItem,
  changeFilter,
  changeOrderSearch,
  changeProductSearch,
  orderStore,
  productStore,
  updateOrders,
  updateProducts,
  updateUser,
  userStore,
} from './UserInfo.State';
import useUserInfo from './useUserInfo';

const DEFAULT_RELATED_PRODUCTS: ProductItem[] = [
  { id: 'related-1', name: 'Catfish', price: 24, stockLeft: 45 },
  { id: 'related-2', name: 'Poop Scooper', price: 203, stockLeft: 3 },
  { id: 'related-3', name: 'Archer target', price: 699, stockLeft: 32 },
];

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

const SideItemName = styled.span`
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  };

  const handleViewAllOrders = () => {
    changeFilter(undefined);
    changeOrderSearch('');
    ordersTableSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  const recentOrdersPreview = orderSnap.orders.slice(0, 3);
  const relatedProductsSource =
    productSnap.products.length > 0 ? productSnap.products : DEFAULT_RELATED_PRODUCTS;
  const relatedProductsPreview = relatedProductsSource.slice(0, 3);

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
            <SummarySection aria-label="Last 30 days summary">
              <SummaryHeading>In the last 30 days,</SummaryHeading>
              <MetricsGrid>
                <MetricCard>
                  <MetricValue>{userSnap.user.recentOrders}</MetricValue>
                  <MetricLabel>orders made</MetricLabel>
                </MetricCard>
                <MetricCard $hideOnMobile>
                  <MetricValue>
                    {productSnap.products.length > 0
                      ? productSnap.products.length
                      : userSnap.user.newProducts}
                  </MetricValue>
                  <MetricLabel>New products</MetricLabel>
                </MetricCard>
                <MetricCard>
                  <MetricValue>{userSnap.user.nextDeliveryDate || 'TBD'}</MetricValue>
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
                      <SideItemName>{order.productName}</SideItemName>
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
              {productSnap.search && (
                <Alert
                  severity="info"
                  onClose={() => changeProductSearch('')}
                  sx={{ py: 0, px: 1 }}
                >
                  Filtered: {productSnap.search}
                </Alert>
              )}
              <SideList>
                {relatedProductsPreview.map((product) => (
                  <SideListItem key={product.id}>
                    <SideItemName>{product.name}</SideItemName>
                    <SideItemMeta>
                      {product.stockLeft !== undefined ? `${product.stockLeft} left` : 'In stock'}
                    </SideItemMeta>
                    <SideItemPrice>{formatCurrency(product.price)}</SideItemPrice>
                  </SideListItem>
                ))}
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
