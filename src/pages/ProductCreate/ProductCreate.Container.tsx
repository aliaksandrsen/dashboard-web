import { useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import {
  FieldError,
  FieldGroup,
  FieldHint,
  FieldLabel,
  FormActionsRow,
  FormCardPanel,
  FormStack,
  PageHeaderRow,
  PageHeaderText,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  TextInput,
} from '../../components/ui/PagePrimitives';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { ApiProduct } from '../../types/api';
import { extractApiError } from '../../utils/helpers';

interface CreateProductValues {
  name: string;
  price: string;
  description: string;
  stripeProductId: string;
  stripePriceId: string;
}

const ProductCreate = () => {
  useDocumentTitle('Create Product');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const idPrefix = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      name: '',
      price: '',
      description: '',
      stripeProductId: '',
      stripePriceId: '',
    },
  });

  const onSubmit = async (values: CreateProductValues) => {
    setSubmitError(null);
    const trimmedDescription = values.description.trim();
    const trimmedStripeProductId = values.stripeProductId.trim();
    const trimmedStripePriceId = values.stripePriceId.trim();

    try {
      const response = await axios.post<ApiProduct>('/v1/products', {
        name: values.name.trim(),
        price: Number(values.price),
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        ...(trimmedStripeProductId ? { stripeProductId: trimmedStripeProductId } : {}),
        ...(trimmedStripePriceId ? { stripePriceId: trimmedStripePriceId } : {}),
      });

      await queryClient.invalidateQueries({ queryKey: ['products'] });

      navigate('/products', {
        state: {
          flash: {
            type: 'success',
            text: `Product "${response.data?.name ?? values.name.trim()}" created successfully.`,
          },
        },
      });
    } catch (error) {
      setSubmitError(extractApiError(error, 'Failed to create product.'));
    }
  };

  const nameId = `${idPrefix}-name`;
  const priceId = `${idPrefix}-price`;
  const descriptionId = `${idPrefix}-description`;
  const stripeProductId = `${idPrefix}-stripe-product`;
  const stripePriceId = `${idPrefix}-stripe-price`;

  return (
    <PageWrapper>
      <Breadcrumbs items={[{ label: 'Products', to: '/products' }, { label: 'Create Product' }]} />

      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Create Product</PageTitle>
          <PageSubtitle>
            Add a new product to the catalog. Leave Stripe IDs blank to create them automatically in
            Stripe.
          </PageSubtitle>
        </PageHeaderText>
      </PageHeaderRow>

      <FormCardPanel>
        {submitError && (
          <Alert severity="error" role="alert">
            {submitError}
          </Alert>
        )}

        <FormStack noValidate onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldLabel htmlFor={nameId}>
              Product Name <span aria-hidden="true">*</span>
            </FieldLabel>
            <TextInput
              id={nameId}
              type="text"
              required
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? `${nameId}-error` : undefined}
              {...register('name', {
                required: 'Product name is required',
                validate: (val) => val.trim().length > 0 || 'Product name is required',
              })}
            />
            {errors.name && <FieldError id={`${nameId}-error`}>{errors.name.message}</FieldError>}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor={priceId}>
              Price (USD) <span aria-hidden="true">*</span>
            </FieldLabel>
            <TextInput
              id={priceId}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              aria-invalid={errors.price ? 'true' : 'false'}
              aria-describedby={errors.price ? `${priceId}-error` : undefined}
              {...register('price', {
                required: 'Price is required',
                validate: (val) => {
                  const num = Number(val);
                  if (Number.isNaN(num) || num <= 0) {
                    return 'Price must be greater than 0';
                  }
                  return true;
                },
              })}
            />
            {errors.price && (
              <FieldError id={`${priceId}-error`}>{errors.price.message}</FieldError>
            )}
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor={descriptionId}>Stripe Description (optional)</FieldLabel>
            <TextInput
              id={descriptionId}
              type="text"
              aria-invalid="false"
              aria-describedby={`${descriptionId}-hint`}
              {...register('description')}
            />
            <FieldHint id={`${descriptionId}-hint`}>
              Sent to Stripe when creating a new Stripe product automatically.
            </FieldHint>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor={stripeProductId}>Existing Stripe Product ID (optional)</FieldLabel>
            <TextInput
              id={stripeProductId}
              type="text"
              placeholder="prod_..."
              aria-invalid="false"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              {...register('stripeProductId')}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor={stripePriceId}>Existing Stripe Price ID (optional)</FieldLabel>
            <TextInput
              id={stripePriceId}
              type="text"
              placeholder="price_..."
              aria-invalid="false"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              {...register('stripePriceId')}
            />
          </FieldGroup>

          <FormActionsRow>
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </Button>
            <Button component={Link} to="/products" variant="outlined" color="secondary">
              Cancel
            </Button>
          </FormActionsRow>
        </FormStack>
      </FormCardPanel>
    </PageWrapper>
  );
};

export default ProductCreate;
