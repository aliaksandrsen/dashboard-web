import { useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import { ErrorBoundary } from 'react-error-boundary';
import { useSnapshot } from 'valtio';
import { ErrorFallback } from '../../components/ErrorFallbacks';
import Header from '../../components/Header';
import { logError } from '../../utils/helpers';
import { orderStore, updateOrders, updateUser, userStore } from './UserInfo.State';
import useUserInfo from './useUserInfo';

const UserInfo = () => {
  const orderSnap = useSnapshot(orderStore);
  const userSnap = useSnapshot(userStore);

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

  const onSubmitProductSearch = (searchText: string) => {
    console.log('Search text', searchText);
  };

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
        <section aria-label="Orders">
          {orderSnap.orders.map((order) => (
            <div key={order.id}>{order.productName}</div>
          ))}
        </section>
      </ErrorBoundary>
    );
  };

  return (
    <Container component="section">
      {renderUserSection()}
      {renderOrdersSection()}
    </Container>
  );
};

export default UserInfo;
