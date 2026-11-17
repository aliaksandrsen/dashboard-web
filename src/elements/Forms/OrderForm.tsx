import { useId, useState } from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import {
  type Order,
  type ProductItem,
  addOrderToStore,
  createFallbackOrder,
  normalizeOrdersData,
} from '../../pages/UserInfo/UserInfo.State';

export interface OrderFormProps {
  products?: ProductItem[];
  userId?: number;
  onOrderCreated?: (order: Order) => void;
}

interface OrderFormValues {
  firstName: string;
  lastName: string;
  quantity: number;
  productId: string;
  email: string;
  password: string;
  contactTime: string;
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
  max-width: 440px;
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

const PasswordRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 8px;
`;

const PasswordInput = styled(TextInput)`
  flex: 1;
`;

const ToggleButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  padding: 0 10px;
  border: 1px solid #767676;
  border-radius: 6px;
  background-color: #f3f4f6;
  color: #111827;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid #0b57d0;
    outline-offset: 1px;
  }
`;

const FieldError = styled.span`
  color: #d32f2f;
  font-size: 0.75rem;
`;

const OrderForm = ({ products = [], userId, onOrderCreated }: OrderFormProps) => {
  const formHeadingId = useId();
  const baseId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      quantity: 1,
      productId: '',
      email: '',
      password: '',
      contactTime: '',
    },
  });

  const onSubmit = async (values: OrderFormValues) => {
    setSubmitMessage(null);
    setSubmitError(null);

    const selectedProduct = products.find((product) => product.id === values.productId);
    const unitPrice = selectedProduct?.price ?? 49.99;
    const quantity = Number(values.quantity) || 1;
    const total = Number((unitPrice * quantity).toFixed(2));

    try {
      const response = await axios.post('/v1/orders', {
        total,
        ...(userId && userId > 0 ? { userId } : {}),
        ...(selectedProduct ? { productIds: [selectedProduct.id] } : {}),
      });

      const normalized = normalizeOrdersData([response.data]);
      const createdOrder: Order =
        normalized[0] ??
        createFallbackOrder(selectedProduct?.name ?? `Order for ${values.firstName}`, total);

      addOrderToStore(createdOrder);
      onOrderCreated?.(createdOrder);
      setSubmitMessage('Order submitted successfully');
      reset();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Failed to submit order. Please try again.')
        : 'Failed to submit order. Please try again.';
      setSubmitError(Array.isArray(message) ? message.join(', ') : String(message));
    }
  };

  const firstNameId = `${baseId}-firstName`;
  const lastNameId = `${baseId}-lastName`;
  const quantityId = `${baseId}-quantity`;
  const productIdField = `${baseId}-productId`;
  const emailId = `${baseId}-email`;
  const passwordId = `${baseId}-password`;
  const contactTimeId = `${baseId}-contactTime`;

  return (
    <FormCard aria-labelledby={formHeadingId}>
      <FormTitle id={formHeadingId}>Place a New Order</FormTitle>
      <FormSubtitle>Submit an order request and schedule preferred contact time.</FormSubtitle>

      <StyledForm aria-labelledby={formHeadingId} noValidate onSubmit={handleSubmit(onSubmit)}>
        {products.length > 0 && (
          <FieldGroup>
            <FieldLabel htmlFor={productIdField}>Product</FieldLabel>
            <SelectInput id={productIdField} {...register('productId')}>
              <option value="">Standard Order ($49.99)</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (${product.price.toFixed(2)})
                </option>
              ))}
            </SelectInput>
          </FieldGroup>
        )}

        <FieldGroup>
          <FieldLabel htmlFor={firstNameId}>
            First Name <span aria-hidden="true">*</span>
          </FieldLabel>
          <TextInput
            id={firstNameId}
            type="text"
            autoComplete="given-name"
            required
            aria-invalid={errors.firstName ? 'true' : 'false'}
            aria-describedby={errors.firstName ? `${firstNameId}-error` : undefined}
            {...register('firstName', {
              required: 'First name is required',
              minLength: { value: 2, message: 'First name must be at least 2 characters' },
            })}
          />
          {errors.firstName && (
            <FieldError id={`${firstNameId}-error`}>{errors.firstName.message}</FieldError>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor={lastNameId}>
            Last Name <span aria-hidden="true">*</span>
          </FieldLabel>
          <TextInput
            id={lastNameId}
            type="text"
            autoComplete="family-name"
            required
            aria-invalid={errors.lastName ? 'true' : 'false'}
            aria-describedby={errors.lastName ? `${lastNameId}-error` : undefined}
            {...register('lastName', {
              required: 'Last name is required',
              minLength: { value: 2, message: 'Last name must be at least 2 characters' },
            })}
          />
          {errors.lastName && (
            <FieldError id={`${lastNameId}-error`}>{errors.lastName.message}</FieldError>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor={quantityId}>
            Quantity <span aria-hidden="true">*</span>
          </FieldLabel>
          <TextInput
            id={quantityId}
            type="number"
            min={1}
            max={12}
            required
            aria-invalid={errors.quantity ? 'true' : 'false'}
            aria-describedby={errors.quantity ? `${quantityId}-error` : undefined}
            {...register('quantity', {
              valueAsNumber: true,
              required: 'Quantity is required',
              min: { value: 1, message: 'Quantity must be at least 1' },
              max: { value: 12, message: 'Quantity cannot exceed 12' },
            })}
          />
          {errors.quantity && (
            <FieldError id={`${quantityId}-error`}>{errors.quantity.message}</FieldError>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor={emailId}>
            Email <span aria-hidden="true">*</span>
          </FieldLabel>
          <TextInput
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
            <FieldError id={`${emailId}-error`} className="email-errors">
              {errors.email.message}
            </FieldError>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor={passwordId}>
            Password <span aria-hidden="true">*</span>
          </FieldLabel>
          <PasswordRow>
            <PasswordInput
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? `${passwordId}-error` : undefined}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            <ToggleButton
              type="button"
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <VisibilityOffIcon fontSize="small" aria-hidden="true" />
              ) : (
                <VisibilityIcon fontSize="small" aria-hidden="true" />
              )}
            </ToggleButton>
          </PasswordRow>
          {errors.password && (
            <FieldError id={`${passwordId}-error`}>{errors.password.message}</FieldError>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel htmlFor={contactTimeId}>Best Contact Time</FieldLabel>
          <TextInput
            id={contactTimeId}
            type="datetime-local"
            aria-invalid={errors.contactTime ? 'true' : 'false'}
            aria-describedby={errors.contactTime ? `${contactTimeId}-error` : undefined}
            {...register('contactTime')}
          />
        </FieldGroup>

        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>

        {submitMessage && (
          <Alert severity="success" role="status">
            {submitMessage}
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
