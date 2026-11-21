import { useEffect, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import {
  FieldError,
  FieldGroup,
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
import { useProduct } from '../../hooks/useProducts';
import { extractApiError } from '../../utils/helpers';

interface EditProductValues {
  name: string;
  price: string;
  stripeProductId: string;
  stripePriceId: string;
}

const ProductEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const idPrefix = useId();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { isLoading, error, data: product, refetch } = useProduct(id);
  useDocumentTitle(product ? `Edit ${product.name}` : 'Edit Product');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProductValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      name: '',
      price: '',
      stripeProductId: '',
      stripePriceId: '',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        price: String(product.price),
        stripeProductId: product.stripeProductId ?? '',
        stripePriceId: product.stripePriceId ?? '',
      });
    }
  }, [product, reset]);

  const onSaveProduct = async (values: EditProductValues) => {
    if (!id) return;
    setSubmitError(null);
    const trimmedStripeProductId = values.stripeProductId.trim();
    const trimmedStripePriceId = values.stripePriceId.trim();

    try {
      await axios.patch(`/v1/products/${id}`, {
        name: values.name.trim(),
        price: Number(values.price),
        stripeProductId: trimmedStripeProductId || null,
        stripePriceId: trimmedStripePriceId || null,
      });

      await queryClient.invalidateQueries({ queryKey: ['product', id] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });

      navigate(`/products/${id}`, {
        state: {
          flash: {
            type: 'success',
            text: `Product "${values.name.trim()}" updated successfully.`,
          },
        },
      });
    } catch (err) {
      setSubmitError(extractApiError(err, 'Failed to update product.'));
    }
  };

  const nameId = `${idPrefix}-name`;
  const priceId = `${idPrefix}-price`;
  const stripeProductId = `${idPrefix}-stripe-product`;
  const stripePriceId = `${idPrefix}-stripe-price`;

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: 'Products', to: '/products' },
          { label: product ? product.name : 'Product', to: `/products/${id ?? ''}` },
          { label: 'Edit' },
        ]}
      />

      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Edit Product</PageTitle>
          <PageSubtitle>Update product details and Stripe identifiers.</PageSubtitle>
        </PageHeaderText>
      </PageHeaderRow>

      {isLoading ? (
        <CircularProgress data-testid="product-edit-loading" />
      ) : error || !product ? (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Product could not be loaded.
        </Alert>
      ) : (
        <FormCardPanel>
          {submitError && (
            <Alert severity="error" role="alert">
              {submitError}
            </Alert>
          )}

          <FormStack noValidate onSubmit={handleSubmit(onSaveProduct)}>
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
                  validate: (v) => v.trim().length > 0 || 'Product name is required',
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
                  validate: (v) => {
                    const num = Number(v);
                    return !Number.isNaN(num) && num > 0 ? true : 'Price must be greater than 0';
                  },
                })}
              />
              {errors.price && (
                <FieldError id={`${priceId}-error`}>{errors.price.message}</FieldError>
              )}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor={stripeProductId}>Stripe Product ID (optional)</FieldLabel>
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
              <FieldLabel htmlFor={stripePriceId}>Stripe Price ID (optional)</FieldLabel>
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
                {isSubmitting ? 'Saving...' : 'Save Product Changes'}
              </Button>
              <Button component={Link} to={`/products/${id}`} variant="outlined" color="secondary">
                Cancel
              </Button>
            </FormActionsRow>
          </FormStack>
        </FormCardPanel>
      )}
    </PageWrapper>
  );
};

export default ProductEdit;
