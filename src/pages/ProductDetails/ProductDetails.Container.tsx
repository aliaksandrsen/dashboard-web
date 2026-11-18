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
import { type BackendProduct, changeProductSearch, userStore } from '../UserInfo/UserInfo.State';

interface EditProductValues {
  name: string;
  price: number;
  stripeProductId: string;
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
  grid-template-columns: 150px minmax(0, 1fr);
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
    word-break: break-word;
  }
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

const ProductDetails = () => {
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
    data: product,
    refetch,
  } = useQuery<BackendProduct>({
    queryKey: ['product', id],
    enabled: Boolean(id),
    queryFn: () => axios.get<BackendProduct>(`/v1/products/${id}`).then((res) => res.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProductValues>({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      price: 0,
      stripeProductId: '',
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        price: product.price,
        stripeProductId: product.stripeProductId ?? '',
      });
    }
  }, [product, reset]);

  const onSaveProduct = async (values: EditProductValues) => {
    if (!id) return;
    setStatusMessage(null);
    const trimmedStripeId = values.stripeProductId.trim();
    try {
      await axios.patch(`/v1/products/${id}`, {
        name: values.name.trim(),
        price: Number(values.price),
        ...(trimmedStripeId ? { stripeProductId: trimmedStripeId } : {}),
      });
      await queryClient?.invalidateQueries({ queryKey: ['product', id] });
      await queryClient?.invalidateQueries({ queryKey: ['productsData'] });
      await refetch();
      setStatusMessage({ type: 'success', text: `Product "${values.name}" updated.` });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to update product.')
        : 'Failed to update product.';
      setStatusMessage({
        type: 'error',
        text: Array.isArray(msg) ? msg.join(', ') : String(msg),
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!id) return;
    setIsDeleting(true);
    setStatusMessage(null);
    try {
      await axios.delete(`/v1/products/${id}`);
      await queryClient?.invalidateQueries({ queryKey: ['productsData'] });
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      navigate('/products');
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to delete product.' });
      setIsDeleting(false);
    }
  };

  const nameId = `${idPrefix}-product-name`;
  const priceId = `${idPrefix}-product-price`;
  const stripeId = `${idPrefix}-product-stripe`;

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
          <PageTitle>{product ? product.name : 'Product Details'}</PageTitle>
          <Button component={SafeLink} to="/products" variant="outlined">
            Back to Products
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
          <CircularProgress data-testid="product-details-loading" />
        ) : error || !product ? (
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            Product could not be loaded.
          </Alert>
        ) : (
          <TwoColumnGrid>
            <Panel aria-label="Product overview">
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
                <dt>Created</dt>
                <dd>{product.createdAt ? formatShortDate(product.createdAt) : 'Unknown'}</dd>
                <dt>Updated</dt>
                <dd>{product.updatedAt ? formatShortDate(product.updatedAt) : 'Unknown'}</dd>
              </DetailList>

              <DangerRow>
                {!confirmingDelete ? (
                  <Button
                    type="button"
                    color="error"
                    variant="outlined"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete Product
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      color="error"
                      variant="contained"
                      disabled={isDeleting}
                      onClick={handleDeleteProduct}
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

            <Panel aria-labelledby={`${idPrefix}-edit-product-title`}>
              <PanelTitle id={`${idPrefix}-edit-product-title`}>Edit Product</PanelTitle>
              <FormStack
                aria-labelledby={`${idPrefix}-edit-product-title`}
                noValidate
                onSubmit={handleSubmit(onSaveProduct)}
              >
                <FieldGroup>
                  <FieldLabel htmlFor={nameId}>Product Name</FieldLabel>
                  <StyledInput
                    id={nameId}
                    type="text"
                    required
                    aria-invalid={errors.name ? 'true' : 'false'}
                    {...register('name', { required: 'Product name is required' })}
                  />
                  {errors.name && <ErrorText>{errors.name.message}</ErrorText>}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={priceId}>Price (USD)</FieldLabel>
                  <StyledInput
                    id={priceId}
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    aria-invalid={errors.price ? 'true' : 'false'}
                    {...register('price', {
                      valueAsNumber: true,
                      required: 'Price is required',
                      min: { value: 0.01, message: 'Price must be positive' },
                    })}
                  />
                  {errors.price && <ErrorText>{errors.price.message}</ErrorText>}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={stripeId}>Stripe Product ID (optional)</FieldLabel>
                  <StyledInput
                    id={stripeId}
                    type="text"
                    placeholder="prod_..."
                    aria-invalid="false"
                    {...register('stripeProductId')}
                  />
                </FieldGroup>

                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Product Changes'}
                </Button>
              </FormStack>
            </Panel>
          </TwoColumnGrid>
        )}
      </PageBody>
    </Container>
  );
};

export default ProductDetails;
