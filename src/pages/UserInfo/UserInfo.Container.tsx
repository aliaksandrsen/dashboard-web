import { useEffect } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import { useSnapshot } from 'valtio';
import Header from '../../components/Header';
import { orderStore, updateOrders, updateUser, userStore } from './UserInfo.State';
import useUserInfo from './useUserInfo';

const UserInfo = () => {
  const orderSnap = useSnapshot(orderStore);
  const userSnap = useSnapshot(userStore);

  const { orderData, ordersAreLoading, ordersErrors, userData, userIsLoading, userErrors } =
    useUserInfo();

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

  if (userErrors || ordersErrors) {
    return <Alert severity="error">Something went wrong</Alert>;
  }

  return (
    <Container component="section">
      {userIsLoading ? (
        <CircularProgress data-testid="user-loading-circle" />
      ) : (
        <Header
          userName={userSnap.user.name}
          joinedDate={userSnap.user.joinedDate}
          onSubmitSearch={onSubmitProductSearch}
        />
      )}
      {ordersAreLoading ? (
        <CircularProgress color="secondary" data-testid="orders-loading-circle" />
      ) : (
        <section aria-label="Orders">
          {orderSnap.orders.map((order) => (
            <div key={order.id}>{order.productName}</div>
          ))}
        </section>
      )}
    </Container>
  );
};

export default UserInfo;
