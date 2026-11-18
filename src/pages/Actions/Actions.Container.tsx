import { useContext, useEffect, useId, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { QueryClientContext } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useSnapshot } from 'valtio';
import Header from '../../components/Header';
import SafeLink from '../../components/SafeLink';
import OrderForm from '../../elements/Forms';
import { useProducts } from '../../hooks/useProducts';
import { useUsers } from '../../hooks/useUsers';
import { formatCurrency, formatShortDate } from '../../utils/helpers';
import {
  type Order,
  changeProductSearch,
  orderStore,
  productStore,
  removeOrderFromStore,
  updateOrders,
  updateProducts,
  updateUser,
  updateUsersList,
  userStore,
} from '../UserInfo/UserInfo.State';
import useUserInfo from '../UserInfo/useUserInfo';

interface ProfileFormValues {
  address: string;
  name: string;
  email: string;
}

const PageSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 40px;
`;

const PageHeading = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ActionCard = styled.section`
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  text-align: center;
`;

const CardList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CardListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.8125rem;
  color: #374151;
`;

const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const ItemLink = styled(SafeLink)`
  font-weight: 600;
  color: #111827;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
    color: #0b57d0;
  }
`;

const ItemMeta = styled.span`
  color: #6b7280;
  font-size: 0.75rem;
`;

const OrderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const CompactLink = styled(SafeLink)`
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  padding: 6px 10px;
  min-height: 32px;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  background-color: #4b5563;
  color: #ffffff;
  box-sizing: border-box;

  &:hover,
  &:focus-visible {
    background-color: #374151;
  }
`;

const CompactButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  border: 0;
  border-radius: 4px;
  padding: 6px 10px;
  min-height: 32px;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background-color: ${({ $variant }) => ($variant === 'danger' ? '#fee2e2' : '#4b5563')};
  color: ${({ $variant }) => ($variant === 'danger' ? '#991b1b' : '#ffffff')};

  &:hover {
    background-color: ${({ $variant }) => ($variant === 'danger' ? '#fecaca' : '#374151')};
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const DarkLinkButton = styled(SafeLink)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 18px;
  border-radius: 6px;
  background-color: #4b5563;
  color: #ffffff;
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 600;

  &:hover,
  &:focus-visible {
    background-color: #374151;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ProfileFormCard = styled.section`
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
`;

const ProfileForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProfileRow = styled.div`
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  background-color: #f3f4f6;
  padding: 10px 14px;
  border-radius: 8px;

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ProfileLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const ProfileInput = styled.input`
  font: inherit;
  font-size: max(1rem, 0.875rem);
  min-height: 40px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: #ffffff;
  color: #111827;

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 1px;
  }
`;

const ErrorText = styled.span`
  color: #d32f2f;
  font-size: 0.75rem;
  grid-column: 2;
`;

const Actions = () => {
  const orderSnap = useSnapshot(orderStore);
  const userSnap = useSnapshot(userStore);
  const productSnap = useSnapshot(productStore);
  const navigate = useNavigate();
  const queryClient = useContext(QueryClientContext);
  const formId = useId();
  const [actionStatus, setActionStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { orderData, refetchOrders, userData, refetchUser } = useUserInfo();
  const { productsData } = useProducts();
  const { usersData } = useUsers();

  const syncedOrdersRef = useRef<Order[] | undefined>(undefined);
  const syncedUserRef = useRef<typeof userData>(undefined);

  useEffect(() => {
    if (orderData && orderData !== syncedOrdersRef.current) {
      syncedOrdersRef.current = orderData;
      updateOrders(orderData);
    }
  }, [orderData]);

  useEffect(() => {
    if (userData && userData !== syncedUserRef.current) {
      syncedUserRef.current = userData;
      updateUser(userData);
    }
  }, [userData]);

  useEffect(() => {
    if (productsData) {
      updateProducts(productsData);
    }
  }, [productsData]);

  useEffect(() => {
    if (usersData) {
      updateUsersList(usersData);
    }
  }, [usersData]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    mode: 'onBlur',
    defaultValues: {
      address: userSnap.user.address ?? '',
      name: userSnap.user.name ?? '',
      email: userSnap.user.email ?? '',
    },
  });

  useEffect(() => {
    reset({
      address: userSnap.user.address ?? '',
      name: userSnap.user.name ?? '',
      email: userSnap.user.email ?? '',
    });
  }, [userSnap.user.address, userSnap.user.name, userSnap.user.email, reset]);

  const handleCancelOrder = async (order: Pick<Order, 'id' | 'productName'>) => {
    const numericId = Number(order.id);
    try {
      if (!Number.isNaN(numericId) && numericId > 0) {
        await axios.delete(`/v1/orders/${numericId}`);
      }
      removeOrderFromStore(order.id);
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      setActionStatus({
        type: 'success',
        text: `Order #${order.id} ("${order.productName}") deleted.`,
      });
    } catch {
      setActionStatus({
        type: 'error',
        text: `Failed to delete order "${order.productName}".`,
      });
    }
  };

  const handleTriggerStripeSync = async () => {
    setIsSyncing(true);
    setActionStatus(null);
    try {
      const res = await axios.post<{
        message: string;
        result: { processed: number; created: number; skipped: number };
      }>('/v1/jobs/sync-stripe', {});
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      await refetchOrders();
      setActionStatus({
        type: 'success',
        text: `${res.data.message} (processed: ${res.data.result.processed}, created: ${res.data.result.created})`,
      });
    } catch {
      setActionStatus({
        type: 'error',
        text: 'Failed to trigger Stripe orders sync.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const onSubmitProfile = async (values: ProfileFormValues) => {
    setActionStatus(null);
    try {
      const targetUserId = userSnap.user.id;
      const response = targetUserId
        ? await axios.patch(`/v1/users/${targetUserId}`, values)
        : await axios.post('/v1/users', values);

      updateUser({
        ...userSnap.user,
        id: response.data?.id ?? targetUserId,
        name: response.data?.name ?? values.name,
        email: response.data?.email ?? values.email,
        address: response.data?.address ?? values.address,
      });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      await queryClient?.invalidateQueries({ queryKey: ['usersList'] });
      await refetchUser();
      setActionStatus({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Failed to update profile')
        : 'Failed to update profile';
      setActionStatus({
        type: 'error',
        text: Array.isArray(message) ? message.join(', ') : String(message),
      });
    }
  };

  const recentOrders = orderSnap.orders.slice(0, 3);
  const recentProducts = productSnap.products.slice(0, 3);
  const recentUsers = (usersData ?? userSnap.users).slice(0, 3);

  const addressId = `${formId}-address`;
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;

  return (
    <Container component="section" maxWidth="xl">
      <Header
        userName={userSnap.user.name}
        joinedDate={userSnap.user.joinedDate}
        onSubmitSearch={(query) => {
          changeProductSearch(query);
          navigate('/products');
        }}
      />

      <PageSection aria-labelledby={`${formId}-heading`}>
        <PageHeading id={`${formId}-heading`}>Changes you can make</PageHeading>

        {actionStatus && (
          <Alert
            severity={actionStatus.type}
            role={actionStatus.type === 'error' ? 'alert' : 'status'}
            onClose={() => setActionStatus(null)}
          >
            {actionStatus.text}
          </Alert>
        )}

        <CardsGrid>
          <ActionCard aria-label="Recent orders actions">
            <CardTitle>Recent orders</CardTitle>
            <CardList>
              {recentOrders.length === 0 ? (
                <li>
                  <ItemMeta>No recent orders found.</ItemMeta>
                </li>
              ) : (
                recentOrders.map((order) => (
                  <CardListItem key={order.id}>
                    <ItemDetails>
                      <ItemLink to={`/orders/${order.id}`}>{order.productName}</ItemLink>
                      <ItemMeta>
                        {formatShortDate(order.orderedDate)} · {formatCurrency(order.totalAmount)}
                      </ItemMeta>
                    </ItemDetails>
                    <OrderButtons>
                      <CompactLink to={`/orders/${order.id}`}>Edit</CompactLink>
                      <CompactButton
                        type="button"
                        $variant="danger"
                        aria-label={`Cancel ${order.productName}`}
                        onClick={() => handleCancelOrder(order)}
                      >
                        Delete
                      </CompactButton>
                    </OrderButtons>
                  </CardListItem>
                ))
              )}
            </CardList>
            <CardFooter>
              <DarkLinkButton to="/">View all orders</DarkLinkButton>
            </CardFooter>
          </ActionCard>

          <ActionCard aria-label="Catalog products overview">
            <CardTitle>Products</CardTitle>
            <CardList>
              {recentProducts.length === 0 ? (
                <li>
                  <ItemMeta>No products in catalog yet.</ItemMeta>
                </li>
              ) : (
                recentProducts.map((item) => (
                  <CardListItem key={item.id}>
                    <ItemDetails>
                      <ItemLink to={`/products/${item.id}`}>{item.name}</ItemLink>
                      <ItemMeta>
                        {item.createdAt ? formatShortDate(item.createdAt) : 'Active'}
                      </ItemMeta>
                    </ItemDetails>
                    <strong>{formatCurrency(item.price)}</strong>
                  </CardListItem>
                ))
              )}
            </CardList>
            <CardFooter>
              <DarkLinkButton to="/products">View all products</DarkLinkButton>
            </CardFooter>
          </ActionCard>

          <ActionCard aria-label="Users and Stripe sync">
            <CardTitle>Customers &amp; Stripe Sync</CardTitle>
            <CardList>
              {recentUsers.length === 0 ? (
                <li>
                  <ItemMeta>No customers created yet.</ItemMeta>
                </li>
              ) : (
                recentUsers.map((customer) => (
                  <CardListItem key={customer.id ?? customer.email}>
                    <ItemDetails>
                      <ItemLink to={`/users/${customer.id}`}>{customer.name}</ItemLink>
                      <ItemMeta>{customer.email}</ItemMeta>
                    </ItemDetails>
                    <span>{customer.recentOrders} orders</span>
                  </CardListItem>
                ))
              )}
            </CardList>
            <CardFooter>
              <DarkLinkButton to="/users">Manage users</DarkLinkButton>
              <CompactButton type="button" disabled={isSyncing} onClick={handleTriggerStripeSync}>
                {isSyncing ? 'Syncing...' : 'Sync Stripe'}
              </CompactButton>
            </CardFooter>
          </ActionCard>
        </CardsGrid>

        <BottomGrid>
          <OrderForm
            products={[...productSnap.products]}
            users={[...(usersData ?? userSnap.users)]}
            defaultUserId={userSnap.user.id}
            onOrderCreated={() => {
              void refetchOrders();
            }}
          />

          <ProfileFormCard aria-labelledby={`${formId}-profile-title`}>
            <CardTitle
              id={`${formId}-profile-title`}
              style={{ textAlign: 'left', marginBottom: 14 }}
            >
              {userSnap.user.id ? 'Account Information' : 'Create First Customer'}
            </CardTitle>
            <ProfileForm
              aria-labelledby={`${formId}-profile-title`}
              noValidate
              onSubmit={handleSubmit(onSubmitProfile)}
            >
              <ProfileRow>
                <ProfileLabel htmlFor={addressId}>Address</ProfileLabel>
                <ProfileInput
                  id={addressId}
                  type="text"
                  autoComplete="street-address"
                  required
                  aria-invalid={errors.address ? 'true' : 'false'}
                  aria-describedby={errors.address ? `${addressId}-error` : undefined}
                  {...register('address', { required: 'Address is required' })}
                />
                {errors.address && (
                  <ErrorText id={`${addressId}-error`}>{errors.address.message}</ErrorText>
                )}
              </ProfileRow>

              <ProfileRow>
                <ProfileLabel htmlFor={nameId}>Name</ProfileLabel>
                <ProfileInput
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  required
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? `${nameId}-error` : undefined}
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <ErrorText id={`${nameId}-error`}>{errors.name.message}</ErrorText>}
              </ProfileRow>

              <ProfileRow>
                <ProfileLabel htmlFor={emailId}>Email</ProfileLabel>
                <ProfileInput
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? `${emailId}-error` : undefined}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                />
                {errors.email && (
                  <ErrorText id={`${emailId}-error`}>{errors.email.message}</ErrorText>
                )}
              </ProfileRow>

              <div>
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </ProfileForm>
          </ProfileFormCard>
        </BottomGrid>
      </PageSection>
    </Container>
  );
};

export default Actions;
