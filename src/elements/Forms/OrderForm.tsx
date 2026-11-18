import { useContext, useEffect, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { QueryClientContext } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import SafeLink from '../../components/SafeLink';
import {
  type Order,
  type ProductItem,
  type UserInfoData,
  addOrderToStore,
  createFallbackOrder,
  normalizeOrdersData,
} from '../../pages/UserInfo/UserInfo.State';
import { formatCurrency } from '../../utils/helpers';

export interface OrderFormProps {
  products?: ProductItem[];
  users?: UserInfoData[];
  defaultUserId?: number;
  onOrderCreated?: (order: Order) => void;
}

interface OrderFormValues {
  userId: string;
  total: number;
  stripeInvoiceId: string;
}

const FormCard = styled.section`
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
`;

const FormTitle = styled.h2`
  margin: 0 0 4px;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
`;

const FormSubtitle = styled.p`
  margin: 0 0 16px;
  font-size: 0.875rem;
  color: #6b7280;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 520px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
`;

const TextInput = styled.input`
  font: inherit;
  font-size: max(1rem, 0.875rem);
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #767676;
  border-radius: 6px;
  background-color: #ffffff;
  color: #111827;
  box-sizing: border-box;

  &:focus-visible {
    outline: 3px solid #0b57d0;
    outline-offset: 1px;
  }

  &[aria-invalid='true'] {
    border-color: #d32f2f;
  }
`;

const SelectInput = styled.select`
  font: inherit;
  font-size: max(1rem, 0.875rem);
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid #767676;
  border-radius: 6px;
  background-color: #ffffff;
  color: #111827;
  box-sizing: border-box;

  &:focus-visible {
    outline: 3px solid #0b57d0;
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

const ProductsLegend = styled.legend`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  padding: 0 4px;
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.875rem;
  color: #111827;
  cursor: pointer;
`;

const CheckboxLeft = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const FieldError = styled.span`
  color: #d32f2f;
  font-size: 0.75rem;
`;

const OrderForm = ({
  products = [],
  users = [],
  defaultUserId,
  onOrderCreated,
}: OrderFormProps) => {
  const formHeadingId = useId();
  const baseId = useId();
  const queryClient = useContext(QueryClientContext);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      userId: defaultUserId ? String(defaultUserId) : '',
      total: 49.99,
      stripeInvoiceId: '',
    },
  });

  useEffect(() => {
    if (defaultUserId !== undefined) {
      setValue('userId', String(defaultUserId));
    }
  }, [defaultUserId, setValue]);

  const toggleProductSelection = (product: ProductItem) => {
    setSelectedProductIds((prev) => {
      const exists = prev.includes(product.id);
      const nextIds = exists ? prev.filter((id) => id !== product.id) : [...prev, product.id];
      if (nextIds.length > 0) {
        const sum = nextIds.reduce((acc, id) => {
          const item = products.find((p) => p.id === id);
          return acc + (item?.price ?? 0);
        }, 0);
        setValue('total', Number(sum.toFixed(2)), { shouldValidate: true });
      }
      return nextIds;
    });
  };

  const onSubmit = async (values: OrderFormValues) => {
    setCreatedOrder(null);
    setSubmitError(null);

    const parsedTotal = Number(values.total);
    const parsedUserId = values.userId ? Number(values.userId) : undefined;
    const trimmedInvoice = values.stripeInvoiceId.trim();

    try {
      const response = await axios.post('/v1/orders', {
        total: parsedTotal,
        ...(parsedUserId && !Number.isNaN(parsedUserId) && parsedUserId > 0
          ? { userId: parsedUserId }
          : {}),
        ...(trimmedInvoice ? { stripeInvoiceId: trimmedInvoice } : {}),
        ...(selectedProductIds.length > 0 ? { productIds: selectedProductIds } : {}),
      });

      const normalized = normalizeOrdersData([response.data]);
      const nextOrder: Order = normalized[0] ?? createFallbackOrder(`Order`, parsedTotal);

      addOrderToStore(nextOrder);
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      await queryClient?.invalidateQueries({ queryKey: ['userData'] });
      await queryClient?.invalidateQueries({ queryKey: ['usersList'] });

      onOrderCreated?.(nextOrder);
      setCreatedOrder(nextOrder);
      setSelectedProductIds([]);
      reset({
        userId: defaultUserId ? String(defaultUserId) : '',
        total: 49.99,
        stripeInvoiceId: '',
      });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Failed to create order. Please try again.')
        : 'Failed to create order. Please try again.';
      setSubmitError(Array.isArray(message) ? message.join(', ') : String(message));
    }
  };

  const userSelectId = `${baseId}-userId`;
  const totalInputId = `${baseId}-total`;
  const invoiceInputId = `${baseId}-stripeInvoiceId`;

  return (
    <FormCard aria-labelledby={formHeadingId}>
      <FormTitle id={formHeadingId}>Create New Order</FormTitle>
      <FormSubtitle>
        Select products and customer to create an order via <code>POST /v1/orders</code>.
      </FormSubtitle>

      <StyledForm aria-labelledby={formHeadingId} noValidate onSubmit={handleSubmit(onSubmit)}>
        {users.length > 0 && (
          <FieldGroup>
            <FieldLabel htmlFor={userSelectId}>Customer</FieldLabel>
            <SelectInput id={userSelectId} {...register('userId')}>
              <option value="">Unassigned (no user)</option>
              {users
                .filter((u) => u.id !== undefined)
                .map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.name} ({user.email ?? `ID #${user.id}`})
                  </option>
                ))}
            </SelectInput>
          </FieldGroup>
        )}

        {products.length > 0 && (
          <ProductsFieldset>
            <ProductsLegend>Products</ProductsLegend>
            {products.map((product) => {
              const checked = selectedProductIds.includes(product.id);
              return (
                <CheckboxRow key={product.id}>
                  <CheckboxLeft>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProductSelection(product)}
                    />
                    <span>{product.name}</span>
                  </CheckboxLeft>
                  <span>{formatCurrency(product.price)}</span>
                </CheckboxRow>
              );
            })}
          </ProductsFieldset>
        )}

        <FieldGroup>
          <FieldLabel htmlFor={totalInputId}>
            Total Amount (USD) <span aria-hidden="true">*</span>
          </FieldLabel>
          <TextInput
            id={totalInputId}
            type="number"
            step="0.01"
            min="0.01"
            required
            aria-invalid={errors.total ? 'true' : 'false'}
            aria-describedby={errors.total ? `${totalInputId}-error` : undefined}
            {...register('total', {
              valueAsNumber: true,
              required: 'Total amount is required',
              min: { value: 0.01, message: 'Total must be greater than 0' },
            })}
          />
          {errors.total && (
            <FieldError id={`${totalInputId}-error`}>{errors.total.message}</FieldError>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor={invoiceInputId}>Stripe Invoice ID (optional)</FieldLabel>
          <TextInput
            id={invoiceInputId}
            type="text"
            placeholder="in_..."
            aria-invalid="false"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            {...register('stripeInvoiceId')}
          />
        </FieldGroup>

        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Order...' : 'Create Order'}
        </Button>

        {createdOrder && (
          <Alert severity="success" role="status">
            Order #{createdOrder.id} created successfully.{' '}
            <SafeLink to={`/orders/${createdOrder.id}`}>View order details</SafeLink>
          </Alert>
        )}

        {submitError && (
          <Alert severity="error" role="alert">
            {submitError}
          </Alert>
        )}
      </StyledForm>
    </FormCard>
  );
};

export default OrderForm;
