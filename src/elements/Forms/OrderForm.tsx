import { useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  FieldError,
  FieldGroup,
  FieldHint,
  FieldLabel,
  FormActionsRow,
  FormCardPanel,
  FormStack,
  SelectInput,
  TextInput,
} from '../../components/ui/PagePrimitives';
import type { ApiProduct, ApiUser } from '../../types/api';
import { formatCurrency } from '../../utils/helpers';

export interface OrderFormSubmitValues {
  total: number;
  userId: number | null;
  stripeInvoiceId: string | null;
  productIds: string[];
}

export interface OrderFormProps {
  mode: 'create' | 'edit';
  products: readonly ApiProduct[];
  users: readonly ApiUser[];
  initialValues?: {
    userId?: number | null;
    total?: number | string;
    stripeInvoiceId?: string | null;
    productIds?: string[];
  };
  cancelTo: string;
  submitLabel?: string;
  submitError?: string | null;
  onSubmitOrder: (values: OrderFormSubmitValues) => Promise<void>;
}

interface InternalFormValues {
  total: string;
  stripeInvoiceId: string;
}

const ProductsFieldset = styled.fieldset`
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 240px;
  overflow-y: auto;
`;

const ProductsLegend = styled.legend`
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  padding: 0 6px;
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9375rem;
  color: #0f172a;
  cursor: pointer;
  min-height: 32px;
`;

const CheckboxLeft = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const OrderForm = ({
  mode,
  products,
  users,
  initialValues,
  cancelTo,
  submitLabel,
  submitError,
  onSubmitOrder,
}: OrderFormProps) => {
  const baseId = useId();
  const [selectedUserId, setSelectedUserId] = useState<string>(
    initialValues?.userId ? String(initialValues.userId) : '',
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialValues?.productIds ?? [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InternalFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      total: initialValues?.total !== undefined ? String(initialValues.total) : '',
      stripeInvoiceId: initialValues?.stripeInvoiceId ?? '',
    },
  });

  const toggleProductSelection = (product: ApiProduct) => {
    setSelectedProductIds((prev) => {
      const exists = prev.includes(product.id);
      const nextIds = exists ? prev.filter((id) => id !== product.id) : [...prev, product.id];
      const sum = nextIds.reduce((acc, id) => {
        const item = products.find((p) => p.id === id);
        return acc + (item?.price ?? 0);
      }, 0);

      setValue('total', nextIds.length > 0 ? String(Number(sum.toFixed(2))) : '', {
        shouldValidate: nextIds.length > 0,
      });

      return nextIds;
    });
  };

  const onSubmit = async (values: InternalFormValues) => {
    const parsedTotal = Number(values.total);
    const parsedUserId = selectedUserId ? Number(selectedUserId) : null;
    const trimmedInvoice = values.stripeInvoiceId.trim();

    await onSubmitOrder({
      total: parsedTotal,
      userId: parsedUserId && !Number.isNaN(parsedUserId) ? parsedUserId : null,
      stripeInvoiceId: trimmedInvoice || null,
      productIds: selectedProductIds,
    });
  };

  const userSelectId = `${baseId}-userId`;
  const totalInputId = `${baseId}-total`;
  const invoiceInputId = `${baseId}-stripeInvoiceId`;

  return (
    <FormCardPanel>
      {submitError && (
        <Alert severity="error" role="alert">
          {submitError}
        </Alert>
      )}

      <FormStack noValidate onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldLabel htmlFor={userSelectId}>Customer</FieldLabel>
          <SelectInput
            id={userSelectId}
            name="userId"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={String(user.id)}>
                {user.name} ({user.email})
              </option>
            ))}
          </SelectInput>
        </FieldGroup>

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
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            aria-invalid={errors.total ? 'true' : 'false'}
            aria-describedby={errors.total ? `${totalInputId}-error` : `${totalInputId}-hint`}
            {...register('total', {
              required: 'Total amount is required',
              validate: (value) => {
                const numeric = Number(value);
                if (Number.isNaN(numeric) || numeric <= 0) {
                  return 'Total must be greater than 0';
                }
                return true;
              },
            })}
          />
          {errors.total ? (
            <FieldError id={`${totalInputId}-error`}>{errors.total.message}</FieldError>
          ) : (
            <FieldHint id={`${totalInputId}-hint`}>
              Automatically calculated from selected products, or enter a custom total.
            </FieldHint>
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

        <FormActionsRow>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create'
                ? 'Creating...'
                : 'Saving...'
              : (submitLabel ?? (mode === 'create' ? 'Create Order' : 'Save Changes'))}
          </Button>
          <Button component={Link} to={cancelTo} variant="outlined" color="secondary">
            Cancel
          </Button>
        </FormActionsRow>
      </FormStack>
    </FormCardPanel>
  );
};

export default OrderForm;
