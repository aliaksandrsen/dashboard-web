import { useEffect, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import Breadcrumbs from '../../components/Breadcrumbs';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  CardPanel,
  DetailList,
  FieldError,
  FieldGroup,
  FieldHint,
  FieldLabel,
  FormStack,
  PageHeaderActions,
  PageHeaderRow,
  PageHeaderText,
  PageTitle,
  PageWrapper,
  PanelTitle,
  TextInput,
} from '../../components/ui/PagePrimitives';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFlashMessage } from '../../hooks/useFlashMessage';
import { useProduct } from '../../hooks/useProducts';
import type { StripeCheckoutResponse } from '../../types/api';
import { extractApiError, formatCurrency, formatShortDate } from '../../utils/helpers';
import { redirectToExternalUrl } from '../../utils/navigation';

interface CheckoutFormValues {
  priceId: string;
  quantity: number;
}

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const idPrefix = useId();
  const { flash, setFlash, clearFlash } = useFlashMessage();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [quantityDisplay, setQuantityDisplay] = useState<number>(1);

  const { isLoading, error, data: product, refetch } = useProduct(id);
  useDocumentTitle(product ? product.name : 'Product Details');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      priceId: '',
      quantity: 1,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        priceId: product.stripePriceId ?? '',
        quantity: 1,
      });
    }
  }, [product, reset]);

  const checkoutTotal =
    product && Number.isFinite(quantityDisplay) && quantityDisplay >= 1
      ? product.price * quantityDisplay
      : (product?.price ?? 0);

  const onCheckoutSubmit = async (values: CheckoutFormValues) => {
    setCheckoutError(null);
    try {
      const response = await axios.post<StripeCheckoutResponse>('/v1/stripe/payments', {
        priceId: values.priceId.trim(),
        quantity: Number(values.quantity),
      });

      if (response.data?.url) {
        redirectToExternalUrl(response.data.url);
      } else {
        setFlash({ type: 'success', text: 'Stripe checkout session created.' });
      }
    } catch (err) {
      setCheckoutError(extractApiError(err, 'Failed to initiate Stripe checkout.'));
    }
  };

  const handleDeleteProduct = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/v1/products/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/products', {
        state: {
          flash: {
            type: 'success',
            text: `Deleted product "${product?.name ?? id}".`,
          },
        },
      });
    } catch (err) {
      setFlash({
        type: 'error',
        text: extractApiError(err, 'Failed to delete product.'),
      });
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const priceIdInput = `${idPrefix}-stripe-price-id`;
  const quantityInput = `${idPrefix}-checkout-quantity`;

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: 'Products', to: '/products' },
          { label: product ? product.name : 'Product Details' },
        ]}
      />

      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>{product ? product.name : 'Product Details'}</PageTitle>
        </PageHeaderText>
        <PageHeaderActions>
          {product && (
            <>
              <Button
                component={Link}
                to={`/products/${product.id}/edit`}
                variant="contained"
                color="primary"
              >
                Edit Product
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="error"
                onClick={() => setIsDeleteOpen(true)}
              >
                Delete Product
              </Button>
            </>
          )}
          <Button component={Link} to="/products" variant="outlined" color="secondary">
            Back to Products
          </Button>
        </PageHeaderActions>
      </PageHeaderRow>

      {flash && (
        <Alert
          severity={flash.type}
          role={flash.type === 'error' ? 'alert' : 'status'}
          onClose={clearFlash}
        >
          {flash.text}
        </Alert>
      )}

      {isLoading ? (
        <CircularProgress data-testid="product-details-loading" />
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
        <DetailGrid>
          <CardPanel aria-label="Product overview">
            <PanelTitle>Product Overview</PanelTitle>
            <DetailList>
              <dt>Product ID</dt>
              <dd>{product.id}</dd>
              <dt>Name</dt>
              <dd>{product.name}</dd>
              <dt>Price</dt>
              <dd>{formatCurrency(product.price)}</dd>
              <dt>Stripe Product ID</dt>
              <dd>{product.stripeProductId || 'Not linked'}</dd>
              <dt>Stripe Price ID</dt>
              <dd>{product.stripePriceId || 'Not linked'}</dd>
              <dt>Created</dt>
              <dd>{formatShortDate(product.createdAt)}</dd>
              <dt>Updated</dt>
              <dd>{formatShortDate(product.updatedAt)}</dd>
            </DetailList>
          </CardPanel>

          <CardPanel aria-labelledby={`${idPrefix}-checkout-heading`}>
            <PanelTitle id={`${idPrefix}-checkout-heading`}>Stripe Checkout</PanelTitle>

            {checkoutError && (
              <Alert severity="error" role="alert">
                {checkoutError}
              </Alert>
            )}

            <FormStack
              aria-labelledby={`${idPrefix}-checkout-heading`}
              noValidate
              onSubmit={handleSubmit(onCheckoutSubmit)}
            >
              <FieldGroup>
                <FieldLabel htmlFor={priceIdInput}>
                  Stripe Price ID <span aria-hidden="true">*</span>
                </FieldLabel>
                <TextInput
                  id={priceIdInput}
                  type="text"
                  placeholder="price_..."
                  required
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={errors.priceId ? 'true' : 'false'}
                  aria-describedby={
                    errors.priceId ? `${priceIdInput}-error` : `${priceIdInput}-hint`
                  }
                  {...register('priceId', {
                    required: 'Stripe Price ID is required to start checkout',
                    validate: (v) =>
                      v.trim().length > 0 || 'Stripe Price ID is required to start checkout',
                  })}
                />
                {errors.priceId ? (
                  <FieldError id={`${priceIdInput}-error`}>{errors.priceId.message}</FieldError>
                ) : (
                  <FieldHint id={`${priceIdInput}-hint`}>
                    {product.stripePriceId
                      ? 'Pre-filled from this product record.'
                      : 'Enter a Stripe Price ID or link one via Edit Product.'}
                  </FieldHint>
                )}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel htmlFor={quantityInput}>
                  Quantity <span aria-hidden="true">*</span>
                </FieldLabel>
                <TextInput
                  id={quantityInput}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  required
                  aria-invalid={errors.quantity ? 'true' : 'false'}
                  aria-describedby={errors.quantity ? `${quantityInput}-error` : undefined}
                  {...register('quantity', {
                    valueAsNumber: true,
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Quantity must be at least 1' },
                    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                      const nextQty = Number(event.target.value);
                      if (Number.isFinite(nextQty) && nextQty >= 1) {
                        setQuantityDisplay(nextQty);
                      }
                    },
                  })}
                />
                {errors.quantity && (
                  <FieldError id={`${quantityInput}-error`}>{errors.quantity.message}</FieldError>
                )}
              </FieldGroup>

              <div>
                <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Redirecting to Stripe...'
                    : `Pay ${formatCurrency(checkoutTotal)} with Stripe`}
                </Button>
              </div>
            </FormStack>
          </CardPanel>
        </DetailGrid>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        title={`Delete "${product?.name ?? 'this product'}"?`}
        description="This permanently removes the product from the database. This action cannot be undone."
        confirmLabel="Delete Product"
        isConfirming={isDeleting}
        onConfirm={() => void handleDeleteProduct()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </PageWrapper>
  );
};

export default ProductDetails;
