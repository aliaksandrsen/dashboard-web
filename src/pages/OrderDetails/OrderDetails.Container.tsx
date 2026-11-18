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
import { useProducts } from '../../hooks/useProducts';
import { useUsers } from '../../hooks/useUsers';
import { formatCurrency, formatShortDate } from '../../utils/helpers';
import {
  type BackendOrder,
  changeProductSearch,
  removeOrderFromStore,
  userStore,
} from '../UserInfo/UserInfo.State';

interface EditOrderValues {
  userId: string;
  total: number;
  stripeInvoiceId: string;
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
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
  grid-template-columns: 140px minmax(0, 1fr);
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

const ProductChipList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProductChipItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
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

const StyledSelect = styled.select`
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

const ProductsFieldset = styled.fieldset`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.875rem;
  cursor: pointer;
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

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useContext(QueryClientContext);
  const userSnap = useSnapshot(userStore);
  const idPrefix = useId();
  const [selectedProductIds, setSelectedProductIds] = useState<string[] | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { productsData } = useProducts();
  const { usersData } = useUsers();

  const {
    isLoading,
    error,
    data: order,
    refetch,
  } = useQuery<BackendOrder>({
    queryKey: ['order', id],
    enabled: Boolean(id),
    queryFn: () => axios.get<BackendOrder>(`/v1/orders/${id}`).then((res) => res.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditOrderValues>({
    mode: 'onBlur',
    defaultValues: {
      userId: '',
      total: 0,
      stripeInvoiceId: '',
    },
  });

  useEffect(() => {
    if (order) {
      reset({
        userId: order.userId ? String(order.userId) : '',
        total: order.total,
        stripeInvoiceId: order.stripeInvoiceId ?? '',
      });
    }
  }, [order, reset]);

  const productsList = productsData ?? [];
  const usersList = usersData ?? [];
  const activeProductIds = selectedProductIds ?? order?.products?.map((p) => p.id) ?? [];

  const toggleProduct = (productId: string) => {
    const base = selectedProductIds ?? order?.products?.map((p) => p.id) ?? [];
    const exists = base.includes(productId);
    const next = exists ? base.filter((item) => item !== productId) : [...base, productId];
    if (next.length > 0 && productsList.length > 0) {
      const sum = next.reduce((acc, pid) => {
        const found = productsList.find((p) => p.id === pid);
        return acc + (found?.price ?? 0);
      }, 0);
      if (sum > 0) {
        setValue('total', Number(sum.toFixed(2)), { shouldValidate: true });
      }
    }
    setSelectedProductIds(next);
  };

  const onSaveOrder = async (values: EditOrderValues) => {
    if (!id) return;
    setStatusMessage(null);
    const parsedUserId = values.userId ? Number(values.userId) : undefined;
    const trimmedInvoice = values.stripeInvoiceId.trim();

    try {
      await axios.patch(`/v1/orders/${id}`, {
        total: Number(values.total),
        ...(parsedUserId && !Number.isNaN(parsedUserId) ? { userId: parsedUserId } : {}),
        ...(trimmedInvoice ? { stripeInvoiceId: trimmedInvoice } : {}),
        productIds: activeProductIds,
      });

      await queryClient?.invalidateQueries({ queryKey: ['order', id] });
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      await refetch();
      setStatusMessage({ type: 'success', text: `Order #${id} updated successfully.` });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to update order.')
        : 'Failed to update order.';
      setStatusMessage({
        type: 'error',
        text: Array.isArray(msg) ? msg.join(', ') : String(msg),
      });
    }
  };

  const handleDeleteOrder = async () => {
    if (!id) return;
    setIsDeleting(true);
    setStatusMessage(null);
    try {
      await axios.delete(`/v1/orders/${id}`);
      removeOrderFromStore(id);
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      navigate('/');
    } catch {
      setStatusMessage({ type: 'error', text: `Failed to delete order #${id}.` });
      setIsDeleting(false);
    }
  };

  const userFieldId = `${idPrefix}-order-user`;
  const totalFieldId = `${idPrefix}-order-total`;
  const invoiceFieldId = `${idPrefix}-order-invoice`;

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
          <PageTitle>Order Details #{id}</PageTitle>
          <Button component={SafeLink} to="/" variant="outlined">
            Back to Orders
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
          <CircularProgress data-testid="order-details-loading" />
        ) : error || !order ? (
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            Order #{id} could not be loaded.
          </Alert>
        ) : (
          <TwoColumnGrid>
            <Panel aria-label="Order summary">
              <PanelTitle>Order Overview</PanelTitle>
              <DetailList>
                <dt>Order ID</dt>
                <dd>#{order.id}</dd>
                <dt>Total</dt>
                <dd>{formatCurrency(order.total)}</dd>
                <dt>Customer</dt>
                <dd>
                  {order.user ? (
                    <SafeLink to={`/users/${order.user.id}`}>
                      {order.user.name} ({order.user.email})
                    </SafeLink>
                  ) : (
                    'Unassigned'
                  )}
                </dd>
                <dt>Stripe Invoice</dt>
                <dd>{order.stripeInvoiceId || 'None'}</dd>
                <dt>Created</dt>
                <dd>{order.createdAt ? formatShortDate(order.createdAt) : 'Unknown'}</dd>
                <dt>Updated</dt>
                <dd>{order.updatedAt ? formatShortDate(order.updatedAt) : 'Unknown'}</dd>
              </DetailList>

              <PanelTitle style={{ marginTop: 8 }}>Included Products</PanelTitle>
              {order.products && order.products.length > 0 ? (
                <ProductChipList>
                  {order.products.map((product) => (
                    <ProductChipItem key={product.id}>
                      <SafeLink to={`/products/${product.id}`}>{product.name}</SafeLink>
                      <span>{formatCurrency(product.price)}</span>
                    </ProductChipItem>
                  ))}
                </ProductChipList>
              ) : (
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                  No products attached to this order.
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
                    Delete Order
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      color="error"
                      variant="contained"
                      disabled={isDeleting}
                      onClick={handleDeleteOrder}
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

            <Panel aria-labelledby={`${idPrefix}-edit-order-title`}>
              <PanelTitle id={`${idPrefix}-edit-order-title`}>Edit Order</PanelTitle>
              <FormStack
                aria-labelledby={`${idPrefix}-edit-order-title`}
                noValidate
                onSubmit={handleSubmit(onSaveOrder)}
              >
                <FieldGroup>
                  <FieldLabel htmlFor={userFieldId}>Customer</FieldLabel>
                  <StyledSelect id={userFieldId} {...register('userId')}>
                    <option value="">Unassigned</option>
                    {usersList
                      .filter((u) => u.id !== undefined)
                      .map((user) => (
                        <option key={user.id} value={String(user.id)}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                  </StyledSelect>
                </FieldGroup>

                {productsList.length > 0 && (
                  <ProductsFieldset>
                    <legend style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      Attached Products
                    </legend>
                    {productsList.map((product) => (
                      <CheckboxRow key={product.id}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={activeProductIds.includes(product.id)}
                            onChange={() => toggleProduct(product.id)}
                          />
                          <span>{product.name}</span>
                        </span>
                        <span>{formatCurrency(product.price)}</span>
                      </CheckboxRow>
                    ))}
                  </ProductsFieldset>
                )}

                <FieldGroup>
                  <FieldLabel htmlFor={totalFieldId}>Total Amount (USD)</FieldLabel>
                  <StyledInput
                    id={totalFieldId}
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    aria-invalid={errors.total ? 'true' : 'false'}
                    {...register('total', {
                      valueAsNumber: true,
                      required: 'Total amount is required',
                      min: { value: 0.01, message: 'Total must be greater than 0' },
                    })}
                  />
                  {errors.total && <ErrorText>{errors.total.message}</ErrorText>}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={invoiceFieldId}>Stripe Invoice ID</FieldLabel>
                  <StyledInput
                    id={invoiceFieldId}
                    type="text"
                    placeholder="in_..."
                    aria-invalid="false"
                    {...register('stripeInvoiceId')}
                  />
                </FieldGroup>

                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Order Changes'}
                </Button>
              </FormStack>
            </Panel>
          </TwoColumnGrid>
        )}
      </PageBody>
    </Container>
  );
};

export default OrderDetails;
