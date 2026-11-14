import { useEffect } from 'react';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import styled from 'styled-components';
import { useSnapshot } from 'valtio';
import { orderStore, updateOrders, updateUser, userStore } from './UserInfo.State';
import useUserInfo from './useUserInfo';

const Container = styled.div`
  background-color: white;
  height: 100vh;
  width: 100%;
`;

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

  if (userErrors || ordersErrors) {
    return <Alert severity="error">Something went wrong</Alert>;
  }

  return (
    <Container>
      <div>
        {userIsLoading ? (
          <CircularProgress data-testid="user-loading-circle" />
        ) : (
          <div>{userSnap.user.name}</div>
        )}
        <div>Search bar</div>
        {ordersAreLoading ? (
          <CircularProgress color="secondary" data-testid="orders-loading-circle" />
        ) : (
          <div>
            {orderSnap.orders.map((order) => (
              <div key={order.id}>{order.productName}</div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default UserInfo;
