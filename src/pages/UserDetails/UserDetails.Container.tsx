import { useContext, useEffect, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import { QueryClientContext, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useSnapshot } from 'valtio';
import Header from '../../components/Header';
import SafeLink from '../../components/SafeLink';
import { formatCurrency, formatShortDate } from '../../utils/helpers';
import {
  type BackendUser,
  changeProductSearch,
  updateUser,
  userStore,
} from '../UserInfo/UserInfo.State';

interface EditUserValues {
  name: string;
  email: string;
  address: string;
}

const PageBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 40px;
`;

const TopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.375rem;
  font-weight: 600;
  color: #111827;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Panel = styled.section`
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #111827;
`;

const DetailList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px 12px;
  font-size: 0.875rem;

  dt {
    color: #6b7280;
    font-weight: 500;
  }

  dd {
    margin: 0;
    color: #111827;
    font-weight: 600;
  }
`;

const OrdersList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const OrderItemRow = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 0.875rem;
`;

const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
`;

const StyledInput = styled.input`
  font: inherit;
  font-size: max(1rem, 0.875rem);
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid #767676;
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
`;

const DangerRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
`;

const UserDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useContext(QueryClientContext);
  const userSnap = useSnapshot(userStore);
  const idPrefix = useId();
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    isLoading,
    error,
    data: user,
    refetch,
  } = useQuery<BackendUser>({
    queryKey: ['user', id],
    enabled: Boolean(id),
    queryFn: () => axios.get<BackendUser>(`/v1/users/${id}`).then((res) => res.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserValues>({
    mode: 'onBlur',
    defaultValues: { name: '', email: '', address: '' },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, address: user.address });
    }
  }, [user, reset]);

  const onSaveUser = async (values: EditUserValues) => {
    if (!id) return;
    setStatusMessage(null);
    try {
      const response = await axios.patch(`/v1/users/${id}`, {
        name: values.name.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
      });
      if (userSnap.user.id === Number(id)) {
        updateUser({
          ...userSnap.user,
          name: response.data?.name ?? values.name,
          email: response.data?.email ?? values.email,
          address: response.data?.address ?? values.address,
        });
      }
      await queryClient?.invalidateQueries({ queryKey: ['user', id] });
      await queryClient?.invalidateQueries({ queryKey: ['usersList'] });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      await refetch();
      setStatusMessage({ type: 'success', text: 'User profile updated successfully.' });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to update user.')
        : 'Failed to update user.';
      setStatusMessage({
        type: 'error',
        text: Array.isArray(msg) ? msg.join(', ') : String(msg),
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!id) return;
    setIsDeleting(true);
    setStatusMessage(null);
    try {
      await axios.delete(`/v1/users/${id}`);
      await queryClient?.invalidateQueries({ queryKey: ['usersList'] });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      navigate('/users');
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to delete user.' });
      setIsDeleting(false);
    }
  };

  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const addressId = `${idPrefix}-address`;

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

      <PageBody>
        <TopRow>
          <PageTitle>{user ? user.name : `User #${id}`}</PageTitle>
          <Button component={SafeLink} to="/users" variant="outlined">
            Back to Users
          </Button>
        </TopRow>

        {statusMessage && (
          <Alert
            severity={statusMessage.type}
            role={statusMessage.type === 'error' ? 'alert' : 'status'}
          >
            {statusMessage.text}
          </Alert>
        )}

        {isLoading ? (
          <CircularProgress data-testid="user-details-loading" />
        ) : error || !user ? (
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            User #{id} could not be loaded.
          </Alert>
        ) : (
          <TwoColumnGrid>
            <Panel aria-label="User overview">
              <PanelTitle>Customer Overview</PanelTitle>
              <DetailList>
                <dt>User ID</dt>
                <dd>#{user.id}</dd>
                <dt>Name</dt>
                <dd>{user.name}</dd>
                <dt>Email</dt>
                <dd>{user.email}</dd>
                <dt>Address</dt>
                <dd>{user.address}</dd>
              </DetailList>

              <PanelTitle style={{ marginTop: 8 }}>
                Customer Orders ({user.orders?.length ?? 0})
              </PanelTitle>
              {user.orders && user.orders.length > 0 ? (
                <OrdersList>
                  {user.orders.map((order) => (
                    <OrderItemRow key={order.id}>
                      <div>
                        <SafeLink to={`/orders/${order.id}`}>
                          Order #{order.id}
                          {order.products && order.products.length > 0
                            ? ` — ${order.products.map((p) => p.name).join(', ')}`
                            : ''}
                        </SafeLink>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {order.createdAt ? formatShortDate(order.createdAt) : ''}
                        </div>
                      </div>
                      <strong>{formatCurrency(order.total)}</strong>
                    </OrderItemRow>
                  ))}
                </OrdersList>
              ) : (
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                  This customer has no orders yet.
                </p>
              )}

              <DangerRow>
                {!confirmingDelete ? (
                  <Button
                    type="button"
                    color="error"
                    variant="outlined"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete User
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      color="error"
                      variant="contained"
                      disabled={isDeleting}
                      onClick={handleDeleteUser}
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => setConfirmingDelete(false)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </DangerRow>
            </Panel>

            <Panel aria-labelledby={`${idPrefix}-edit-user-title`}>
              <PanelTitle id={`${idPrefix}-edit-user-title`}>Edit Customer</PanelTitle>
              <FormStack
                aria-labelledby={`${idPrefix}-edit-user-title`}
                noValidate
                onSubmit={handleSubmit(onSaveUser)}
              >
                <FieldGroup>
                  <FieldLabel htmlFor={nameId}>Name</FieldLabel>
                  <StyledInput
                    id={nameId}
                    type="text"
                    autoComplete="name"
                    required
                    aria-invalid={errors.name ? 'true' : 'false'}
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <ErrorText>{errors.name.message}</ErrorText>}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={emailId}>Email</FieldLabel>
                  <StyledInput
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    aria-invalid={errors.email ? 'true' : 'false'}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                  />
                  {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={addressId}>Address</FieldLabel>
                  <StyledInput
                    id={addressId}
                    type="text"
                    autoComplete="street-address"
                    required
                    aria-invalid={errors.address ? 'true' : 'false'}
                    {...register('address', { required: 'Address is required' })}
                  />
                  {errors.address && <ErrorText>{errors.address.message}</ErrorText>}
                </FieldGroup>

                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Customer Changes'}
                </Button>
              </FormStack>
            </Panel>
          </TwoColumnGrid>
        )}
      </PageBody>
    </Container>
  );
};

export default UserDetails;
