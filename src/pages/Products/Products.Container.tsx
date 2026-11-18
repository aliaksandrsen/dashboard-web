import { useContext, useEffect, useId, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { QueryClientContext } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useSnapshot } from 'valtio';
import Header from '../../components/Header';
import SafeLink from '../../components/SafeLink';
import { useProducts } from '../../hooks/useProducts';
import { formatCurrency, formatShortDate } from '../../utils/helpers';
import {
  type ProductItem,
  changeProductSearch,
  productStore,
  updateProducts,
  updateUser,
  userStore,
} from '../UserInfo/UserInfo.State';
import useUserInfo from '../UserInfo/useUserInfo';

interface CreateProductValues {
  name: string;
  price: number;
  description: string;
  stripeProductId: string;
}

interface EditProductValues {
  name: string;
  price: number;
  stripeProductId: string;
}

interface CheckoutFormValues {
  priceId: string;
  quantity: number;
}

const PageBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 40px;
`;

const TopBar = styled.div`
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
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 960px) {
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
  gap: 16px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #111827;
`;

const ProductList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProductCard = styled.li`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  background-color: #f9fafb;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const ProductMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProductNameLink = styled(SafeLink)`
  font-weight: 600;
  font-size: 1rem;
  color: #111827;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
    color: #0b57d0;
  }
`;

const ProductSubtext = styled.span`
  font-size: 0.8125rem;
  color: #6b7280;
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
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

const Products = () => {
  const userSnap = useSnapshot(userStore);
  const productSnap = useSnapshot(productStore);
  const queryClient = useContext(QueryClientContext);
  const idPrefix = useId();
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [selectedCheckoutName, setSelectedCheckoutName] = useState<string>('');

  const { userData } = useUserInfo();
  const { productsAreLoading, productsError, productsData, refetchProducts } = useProducts(
    productSnap.search,
  );

  useEffect(() => {
    if (userData && !userStore.user.name) {
      updateUser(userData);
    }
  }, [userData]);

  useEffect(() => {
    if (productsData) {
      updateProducts(productsData);
    }
  }, [productsData]);

  // Client-side filter complements server search in case NestJS CacheKey('products') serves cached list
  const visibleProducts = useMemo(() => {
    const q = productSnap.search.trim().toLowerCase();
    if (!q) {
      return productSnap.products;
    }
    return productSnap.products.filter((product) => product.name.toLowerCase().includes(q));
  }, [productSnap.products, productSnap.search]);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreateForm,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm<CreateProductValues>({
    mode: 'onBlur',
    defaultValues: { name: '', price: 49.99, description: '', stripeProductId: '' },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    formState: { errors: editErrors, isSubmitting: isUpdating },
  } = useForm<EditProductValues>({
    mode: 'onBlur',
    defaultValues: { name: '', price: 0, stripeProductId: '' },
  });

  const {
    register: registerCheckout,
    handleSubmit: handleCheckoutSubmit,
    setFocus: setCheckoutFocus,
    formState: { errors: checkoutErrors, isSubmitting: isCheckingOut },
  } = useForm<CheckoutFormValues>({
    mode: 'onBlur',
    defaultValues: { priceId: '', quantity: 1 },
  });

  const onCreateProduct = async (values: CreateProductValues) => {
    setStatusBanner(null);
    const trimmedStripeId = values.stripeProductId.trim();
    try {
      await axios.post('/v1/products', {
        name: values.name.trim(),
        price: Number(values.price),
        ...(values.description.trim() ? { description: values.description.trim() } : {}),
        ...(trimmedStripeId ? { stripeProductId: trimmedStripeId } : {}),
      });
      await queryClient?.invalidateQueries({ queryKey: ['productsData'] });
      await refetchProducts();
      resetCreateForm();
      setStatusBanner({
        type: 'success',
        text: `Product "${values.name}" created successfully.`,
      });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Failed to create product.')
        : 'Failed to create product.';
      setStatusBanner({
        type: 'error',
        text: Array.isArray(message) ? message.join(', ') : String(message),
      });
    }
  };

  const openEditDialog = (product: ProductItem) => {
    setEditingProduct(product);
    resetEditForm({
      name: product.name,
      price: product.price,
      stripeProductId: product.stripeProductId ?? '',
    });
  };

  const onSaveEditProduct = async (values: EditProductValues) => {
    if (!editingProduct) return;
    setStatusBanner(null);
    const trimmedStripeId = values.stripeProductId.trim();
    try {
      await axios.patch(`/v1/products/${editingProduct.id}`, {
        name: values.name.trim(),
        price: Number(values.price),
        ...(trimmedStripeId ? { stripeProductId: trimmedStripeId } : {}),
      });
      await queryClient?.invalidateQueries({ queryKey: ['productsData'] });
      await queryClient?.invalidateQueries({ queryKey: ['product', editingProduct.id] });
      await refetchProducts();
      setStatusBanner({ type: 'success', text: `Updated product "${values.name}".` });
      setEditingProduct(null);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? 'Failed to update product.')
        : 'Failed to update product.';
      setStatusBanner({
        type: 'error',
        text: Array.isArray(message) ? message.join(', ') : String(message),
      });
    }
  };

  const handleDeleteProduct = async (product: ProductItem) => {
    setStatusBanner(null);
    try {
      await axios.delete(`/v1/products/${product.id}`);
      await queryClient?.invalidateQueries({ queryKey: ['productsData'] });
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      await refetchProducts();
      setStatusBanner({ type: 'success', text: `Deleted product "${product.name}".` });
    } catch {
      setStatusBanner({ type: 'error', text: `Failed to delete product "${product.name}".` });
    }
  };

  const handleTriggerStripeSync = async () => {
    setIsSyncing(true);
    setStatusBanner(null);
    try {
      const res = await axios.post<{
        message: string;
        result: { processed: number; created: number; skipped: number };
      }>('/v1/jobs/sync-stripe', {});
      const { processed, created, skipped } = res.data.result;
      await queryClient?.invalidateQueries({ queryKey: ['orderData'] });
      setStatusBanner({
        type: 'success',
        text: `${res.data.message} (processed: ${processed}, created: ${created}, skipped: ${skipped})`,
      });
    } catch {
      setStatusBanner({
        type: 'error',
        text: 'Stripe synchronization failed. Verify backend Stripe credentials.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const onCheckoutSubmit = async (values: CheckoutFormValues) => {
    setStatusBanner(null);
    try {
      await axios.post('/v1/stripe/payments', {
        priceId: values.priceId.trim(),
        quantity: Number(values.quantity),
      });
      setStatusBanner({
        type: 'success',
        text: 'Stripe checkout session initiated.',
      });
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? (error.response?.data?.message ??
          'Stripe checkout request failed or redirected externally.')
        : 'Stripe checkout request failed.';
      setStatusBanner({
        type: 'error',
        text: Array.isArray(msg) ? msg.join(', ') : String(msg),
      });
    }
  };

  const handlePrepareCheckout = (product: ProductItem) => {
    setSelectedCheckoutName(product.name);
    setCheckoutFocus('priceId');
  };

  const nameInputId = `${idPrefix}-product-name`;
  const priceInputId = `${idPrefix}-product-price`;
  const descInputId = `${idPrefix}-product-description`;
  const stripeProdInputId = `${idPrefix}-product-stripe-id`;
  const checkoutPriceId = `${idPrefix}-checkout-price-id`;
  const checkoutQtyId = `${idPrefix}-checkout-qty`;
  const editNameId = `${idPrefix}-edit-name`;
  const editPriceId = `${idPrefix}-edit-price`;
  const editStripeId = `${idPrefix}-edit-stripe`;

  return (
    <Container component="section" maxWidth="xl">
      <Header
        userName={userSnap.user.name}
        joinedDate={userSnap.user.joinedDate}
        onSubmitSearch={(query) => changeProductSearch(query)}
      />

      <PageBody>
        <TopBar>
          <PageTitle>Products Catalog</PageTitle>
          <Button
            variant="contained"
            type="button"
            disabled={isSyncing}
            onClick={handleTriggerStripeSync}
          >
            {isSyncing ? 'Syncing Stripe...' : 'Sync Stripe Orders'}
          </Button>
        </TopBar>

        {statusBanner && (
          <Alert
            severity={statusBanner.type}
            role={statusBanner.type === 'error' ? 'alert' : 'status'}
            onClose={() => setStatusBanner(null)}
          >
            {statusBanner.text}
          </Alert>
        )}

        {productSnap.search && (
          <Alert
            severity="info"
            action={
              <Button size="small" onClick={() => changeProductSearch('')}>
                Clear
              </Button>
            }
          >
            Showing results for: {productSnap.search}
          </Alert>
        )}

        <TwoColumnGrid>
          <Panel aria-label="Available products">
            <PanelTitle>Catalog Items</PanelTitle>
            {productsAreLoading ? (
              <CircularProgress data-testid="products-loading-circle" />
            ) : productsError ? (
              <Alert
                severity="error"
                action={
                  <Button size="small" onClick={() => refetchProducts()}>
                    Retry
                  </Button>
                }
              >
                Failed to load products
              </Alert>
            ) : visibleProducts.length === 0 ? (
              <ProductSubtext>
                No products match your filter. Use the form to create a product or clear search.
              </ProductSubtext>
            ) : (
              <ProductList>
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id}>
                    <ProductMeta>
                      <ProductNameLink to={`/products/${product.id}`}>
                        {product.name}
                      </ProductNameLink>
                      <ProductSubtext>
                        {formatCurrency(product.price)} ·{' '}
                        {product.createdAt ? formatShortDate(product.createdAt) : 'Active'}
                        {product.stripeProductId ? ` · Stripe: ${product.stripeProductId}` : ''}
                      </ProductSubtext>
                    </ProductMeta>
                    <CardActions>
                      <Button
                        size="small"
                        variant="outlined"
                        component={SafeLink}
                        to={`/products/${product.id}`}
                      >
                        Details
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        type="button"
                        onClick={() => handlePrepareCheckout(product)}
                      >
                        Checkout
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        type="button"
                        aria-label={`Edit ${product.name}`}
                        onClick={() => openEditDialog(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        type="button"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => handleDeleteProduct(product)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </ProductCard>
                ))}
              </ProductList>
            )}
          </Panel>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Panel aria-labelledby={`${idPrefix}-create-title`}>
              <PanelTitle id={`${idPrefix}-create-title`}>Create Product</PanelTitle>
              <FormStack
                aria-labelledby={`${idPrefix}-create-title`}
                noValidate
                onSubmit={handleCreateSubmit(onCreateProduct)}
              >
                <FieldGroup>
                  <FieldLabel htmlFor={nameInputId}>Product Name</FieldLabel>
                  <StyledInput
                    id={nameInputId}
                    type="text"
                    required
                    aria-invalid={createErrors.name ? 'true' : 'false'}
                    aria-describedby={createErrors.name ? `${nameInputId}-error` : undefined}
                    {...registerCreate('name', { required: 'Product name is required' })}
                  />
                  {createErrors.name && (
                    <ErrorText id={`${nameInputId}-error`}>{createErrors.name.message}</ErrorText>
                  )}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={priceInputId}>Price (USD)</FieldLabel>
                  <StyledInput
                    id={priceInputId}
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    aria-invalid={createErrors.price ? 'true' : 'false'}
                    aria-describedby={createErrors.price ? `${priceInputId}-error` : undefined}
                    {...registerCreate('price', {
                      valueAsNumber: true,
                      required: 'Price is required',
                      min: { value: 0.01, message: 'Price must be positive' },
                    })}
                  />
                  {createErrors.price && (
                    <ErrorText id={`${priceInputId}-error`}>{createErrors.price.message}</ErrorText>
                  )}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={descInputId}>Description (optional)</FieldLabel>
                  <StyledInput
                    id={descInputId}
                    type="text"
                    aria-invalid="false"
                    {...registerCreate('description')}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={stripeProdInputId}>
                    Stripe Product ID (optional, skips Stripe creation)
                  </FieldLabel>
                  <StyledInput
                    id={stripeProdInputId}
                    type="text"
                    placeholder="prod_..."
                    aria-invalid="false"
                    {...registerCreate('stripeProductId')}
                  />
                </FieldGroup>

                <Button type="submit" variant="contained" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Product'}
                </Button>
              </FormStack>
            </Panel>

            <Panel aria-labelledby={`${idPrefix}-checkout-title`}>
              <PanelTitle id={`${idPrefix}-checkout-title`}>
                Stripe Checkout{selectedCheckoutName ? `: ${selectedCheckoutName}` : ''}
              </PanelTitle>
              <FormStack
                aria-labelledby={`${idPrefix}-checkout-title`}
                noValidate
                onSubmit={handleCheckoutSubmit(onCheckoutSubmit)}
              >
                <FieldGroup>
                  <FieldLabel htmlFor={checkoutPriceId}>Stripe Price ID</FieldLabel>
                  <StyledInput
                    id={checkoutPriceId}
                    type="text"
                    placeholder="price_..."
                    required
                    aria-invalid={checkoutErrors.priceId ? 'true' : 'false'}
                    aria-describedby={
                      checkoutErrors.priceId ? `${checkoutPriceId}-error` : undefined
                    }
                    {...registerCheckout('priceId', { required: 'Stripe Price ID is required' })}
                  />
                  {checkoutErrors.priceId && (
                    <ErrorText id={`${checkoutPriceId}-error`}>
                      {checkoutErrors.priceId.message}
                    </ErrorText>
                  )}
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={checkoutQtyId}>Quantity</FieldLabel>
                  <StyledInput
                    id={checkoutQtyId}
                    type="number"
                    min={1}
                    required
                    aria-invalid={checkoutErrors.quantity ? 'true' : 'false'}
                    aria-describedby={
                      checkoutErrors.quantity ? `${checkoutQtyId}-error` : undefined
                    }
                    {...registerCheckout('quantity', {
                      valueAsNumber: true,
                      required: 'Quantity is required',
                      min: { value: 1, message: 'Quantity must be at least 1' },
                    })}
                  />
                  {checkoutErrors.quantity && (
                    <ErrorText id={`${checkoutQtyId}-error`}>
                      {checkoutErrors.quantity.message}
                    </ErrorText>
                  )}
                </FieldGroup>

                <Button type="submit" variant="contained" disabled={isCheckingOut}>
                  {isCheckingOut ? 'Processing...' : 'Pay with Stripe'}
                </Button>
              </FormStack>
            </Panel>
          </div>
        </TwoColumnGrid>
      </PageBody>

      <Dialog
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        aria-labelledby={`${idPrefix}-edit-dialog-title`}
      >
        <DialogTitle id={`${idPrefix}-edit-dialog-title`}>Edit Product</DialogTitle>
        <form onSubmit={handleEditSubmit(onSaveEditProduct)} noValidate>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
            <FieldGroup>
              <FieldLabel htmlFor={editNameId}>Edit Product Name</FieldLabel>
              <StyledInput
                id={editNameId}
                type="text"
                required
                aria-invalid={editErrors.name ? 'true' : 'false'}
                {...registerEdit('name', { required: 'Product name is required' })}
              />
              {editErrors.name && <ErrorText>{editErrors.name.message}</ErrorText>}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor={editPriceId}>Edit Price (USD)</FieldLabel>
              <StyledInput
                id={editPriceId}
                type="number"
                step="0.01"
                min="0.01"
                required
                aria-invalid={editErrors.price ? 'true' : 'false'}
                {...registerEdit('price', {
                  valueAsNumber: true,
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Price must be positive' },
                })}
              />
              {editErrors.price && <ErrorText>{editErrors.price.message}</ErrorText>}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor={editStripeId}>Stripe Product ID (optional)</FieldLabel>
              <StyledInput
                id={editStripeId}
                type="text"
                placeholder="prod_..."
                aria-invalid="false"
                {...registerEdit('stripeProductId')}
              />
            </FieldGroup>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Products;
