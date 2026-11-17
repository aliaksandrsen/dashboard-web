import { useEffect, useId, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useSnapshot } from 'valtio';
import Header from '../../components/Header';
import SafeLink from '../../components/SafeLink';
import OrderForm from '../../elements/Forms';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency, formatShortDate } from '../../utils/helpers';
import {
  type Order,
  OrderStatus,
  type OrderStatusKeys,
  orderStore,
  productStore,
  removeOrderFromStore,
  updateOrderStatusInStore,
  updateOrders,
  updateProducts,
  updateUser,
  userStore,
} from '../UserInfo/UserInfo.State';
import useUserInfo from '../UserInfo/useUserInfo';

interface DigitalProduct {
  id: string;
  name: string;
  date: string;
  progress: string;
}

interface BetaProduct {
  id: string;
  name: string;
  date: string;
  price: number;
}

interface ProfileFormValues {
  address: string;
  name: string;
  email: string;
}

const DIGITAL_PRODUCTS: DigitalProduct[] = [
  { id: 'dig-1', name: 'Carpentry Book', date: 'Feb 12, 2024', progress: '43%' },
  { id: 'dig-2', name: 'Massage Therapy Course', date: 'Jan 9, 2025', progress: '87%' },
  { id: 'dig-3', name: 'Private Pilot Course', date: 'Apr 4, 2025', progress: '47%' },
];

const DEFAULT_BETA_PRODUCTS: BetaProduct[] = [
  { id: 'beta-1', name: 'Dog collar', date: 'Aug 5, 2025', price: 293 },
  { id: 'beta-2', name: 'Aquarium', date: 'Aug 12, 2025', price: 777 },
  { id: 'beta-3', name: 'Moon cakes', date: 'Aug 28, 2025', price: 134 },
];

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

const ItemName = styled.span`
  font-weight: 600;
  color: #111827;
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
  max-width: 680px;
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

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ContactTimeCard = styled.section`
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const TimeDisplayRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`;

const TimeChip = styled.div`
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
`;

const getNextStatus = (status: OrderStatusKeys): OrderStatusKeys => {
  if (status === OrderStatus.Pending) return OrderStatus.Shipped;
  if (status === OrderStatus.Shipped) return OrderStatus.OutOfStock;
  return OrderStatus.Pending;
};

const Actions = () => {
  const orderSnap = useSnapshot(orderStore);
  const userSnap = useSnapshot(userStore);
  const productSnap = useSnapshot(productStore);
  const formId = useId();
  const [searchFilter, setSearchFilter] = useState('');
  const [actionStatus, setActionStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [contactDateTime, setContactDateTime] = useState('2022-11-05T22:34');

  const { orderData, refetchOrders, userData, refetchUser } = useUserInfo();
  const { productsData } = useProducts(searchFilter);
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

  const handleUpdateOrderStatus = async (order: Order) => {
    const nextStatus = getNextStatus(order.status);
    updateOrderStatusInStore(order.id, nextStatus);

    const numericId = Number(order.id);
    if (!Number.isNaN(numericId) && numericId > 0) {
      try {
        await axios.patch(`/v1/orders/${numericId}`, {
          total: order.totalAmount > 0 ? order.totalAmount : 10,
        });
        setActionStatus({
          type: 'success',
          text: `Updated "${order.productName}" status to ${nextStatus}.`,
        });
      } catch {
        setActionStatus({
          type: 'error',
          text: `Failed to sync status change for "${order.productName}" with server.`,
        });
      }
    } else {
      setActionStatus({
        type: 'success',
        text: `Updated "${order.productName}" status to ${nextStatus}.`,
      });
    }
  };

  const handleCancelOrder = async (order: Order) => {
    const numericId = Number(order.id);
    try {
      if (!Number.isNaN(numericId) && numericId > 0) {
        await axios.delete(`/v1/orders/${numericId}`);
      }
      removeOrderFromStore(order.id);
      setActionStatus({
        type: 'success',
        text: `Order "${order.productName}" removed.`,
      });
    } catch {
      setActionStatus({
        type: 'error',
        text: `Failed to cancel order "${order.productName}".`,
      });
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

  const filteredOrders = orderSnap.orders
    .filter((order) =>
      searchFilter ? order.productName.toLowerCase().includes(searchFilter.toLowerCase()) : true,
    )
    .slice(0, 3);

  const betaProducts: BetaProduct[] =
    productSnap.products.length > 0
      ? productSnap.products.slice(0, 3).map((product) => ({
          id: product.id,
          name: product.name,
          date: product.createdAt ? formatShortDate(product.createdAt) : 'Aug 5, 2025',
          price: product.price,
        }))
      : DEFAULT_BETA_PRODUCTS.filter((item) =>
          searchFilter ? item.name.toLowerCase().includes(searchFilter.toLowerCase()) : true,
        );

  const parsedContactDate = new Date(contactDateTime);
  const formattedClock = Number.isNaN(parsedContactDate.getTime())
    ? { hour: '10', minute: '34', period: 'PM', date: '11/05/2022' }
    : {
        hour: String(parsedContactDate.getHours() % 12 || 12).padStart(2, '0'),
        minute: String(parsedContactDate.getMinutes()).padStart(2, '0'),
        period: parsedContactDate.getHours() >= 12 ? 'PM' : 'AM',
        date: parsedContactDate.toLocaleDateString('en-US'),
      };

  const addressId = `${formId}-address`;
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const contactScheduleId = `${formId}-contact-schedule`;

  return (
    <Container component="section" maxWidth="xl">
      <Header
        userName={userSnap.user.name}
        joinedDate={userSnap.user.joinedDate}
        searchName="orders, products"
        onSubmitSearch={(query) => setSearchFilter(query)}
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
              {filteredOrders.length === 0 ? (
                <li>
                  <ItemMeta>No recent orders found.</ItemMeta>
                </li>
              ) : (
                filteredOrders.map((order) => (
                  <CardListItem key={order.id}>
                    <ItemDetails>
                      <ItemName>{order.productName}</ItemName>
                      <ItemMeta>
                        {formatShortDate(order.orderedDate)} · {order.status}
                      </ItemMeta>
                    </ItemDetails>
                    <OrderButtons>
                      <CompactButton type="button" onClick={() => handleUpdateOrderStatus(order)}>
                        Update Status
                      </CompactButton>
                      <CompactButton
                        type="button"
                        $variant="danger"
                        aria-label={`Cancel ${order.productName}`}
                        onClick={() => handleCancelOrder(order)}
                      >
                        Cancel
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

          <ActionCard aria-label="Your digital products">
            <CardTitle>Your digital products</CardTitle>
            <CardList>
              {DIGITAL_PRODUCTS.map((item) => (
                <CardListItem key={item.id}>
                  <ItemName>{item.name}</ItemName>
                  <ItemMeta>{item.date}</ItemMeta>
                  <ItemName>{item.progress}</ItemName>
                </CardListItem>
              ))}
            </CardList>
            <CardFooter>
              <DarkLinkButton to="/products">View all products</DarkLinkButton>
            </CardFooter>
          </ActionCard>

          <ActionCard aria-label="Beta products">
            <CardTitle>Beta products</CardTitle>
            <CardList>
              {betaProducts.map((item) => (
                <CardListItem key={item.id}>
                  <ItemName>{item.name}</ItemName>
                  <ItemMeta>{item.date}</ItemMeta>
                  <ItemName>{formatCurrency(item.price)}</ItemName>
                </CardListItem>
              ))}
            </CardList>
            <CardFooter>
              <DarkLinkButton to="/products">View all beta</DarkLinkButton>
            </CardFooter>
          </ActionCard>
        </CardsGrid>

        <ProfileFormCard aria-labelledby={`${formId}-profile-title`}>
          <CardTitle id={`${formId}-profile-title`} style={{ textAlign: 'left', marginBottom: 14 }}>
            Account Information
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

        <BottomGrid>
          <OrderForm
            products={[...productSnap.products]}
            userId={userSnap.user.id}
            onOrderCreated={() => {
              void refetchOrders();
            }}
          />

          <ContactTimeCard aria-label="Preferred contact schedule">
            <CardTitle style={{ textAlign: 'left' }}>Preferred Contact Schedule</CardTitle>
            <TimeDisplayRow>
              <TimeChip aria-label="Selected hour">{formattedClock.hour}</TimeChip>
              <span aria-hidden="true">:</span>
              <TimeChip aria-label="Selected minute">{formattedClock.minute}</TimeChip>
              <TimeChip aria-label="Selected period">{formattedClock.period}</TimeChip>
              <TimeChip aria-label="Selected date">{formattedClock.date}</TimeChip>
            </TimeDisplayRow>
            <ProfileLabel htmlFor={contactScheduleId}>Adjust contact date &amp; time</ProfileLabel>
            <ProfileInput
              id={contactScheduleId}
              type="datetime-local"
              value={contactDateTime}
              onChange={(event) => setContactDateTime(event.target.value)}
            />
          </ContactTimeCard>
        </BottomGrid>
      </PageSection>
    </Container>
  );
};

export default Actions;
