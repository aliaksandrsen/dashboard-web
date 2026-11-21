import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import Breadcrumbs from '../../components/Breadcrumbs';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  BadgePill,
  CardPanel,
  DetailList,
  EmptyStateText,
  PageHeaderActions,
  PageHeaderRow,
  PageHeaderText,
  PageTitle,
  PageWrapper,
  PanelTitle,
} from '../../components/ui/PagePrimitives';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFlashMessage } from '../../hooks/useFlashMessage';
import { useOrder } from '../../hooks/useOrders';
import { extractApiError, formatCurrency, formatShortDate } from '../../utils/helpers';

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ProductList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ProductRow = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
`;

const InlineLink = styled(Link)`
  color: #1d4ed8;
  font-weight: 600;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle(id ? `Order #${id}` : 'Order Details');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { flash, setFlash, clearFlash } = useFlashMessage();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isLoading, error, data: order, refetch } = useOrder(id);

  const handleDeleteOrder = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/v1/orders/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/orders', {
        state: {
          flash: {
            type: 'success',
            text: `Order #${id} deleted.`,
          },
        },
      });
    } catch (err) {
      setFlash({
        type: 'error',
        text: extractApiError(err, `Failed to delete order #${id}.`),
      });
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <PageWrapper>
      <Breadcrumbs items={[{ label: 'Orders', to: '/orders' }, { label: `Order #${id ?? ''}` }]} />

      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Order #{id}</PageTitle>
        </PageHeaderText>
        <PageHeaderActions>
          {order && (
            <>
              <Button
                component={Link}
                to={`/orders/${order.id}/edit`}
                variant="contained"
                color="primary"
              >
                Edit Order
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="error"
                onClick={() => setIsDeleteOpen(true)}
              >
                Delete Order
              </Button>
            </>
          )}
          <Button component={Link} to="/orders" variant="outlined" color="secondary">
            Back to Orders
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
        <CircularProgress data-testid="order-details-loading" />
      ) : error || !order ? (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Order #{id} could not be loaded.
        </Alert>
      ) : (
        <DetailGrid>
          <CardPanel aria-label="Order overview">
            <PanelTitle>Order Overview</PanelTitle>
            <DetailList>
              <dt>Order ID</dt>
              <dd>#{order.id}</dd>
              <dt>Total</dt>
              <dd>{formatCurrency(order.total)}</dd>
              <dt>Customer</dt>
              <dd>
                {order.user ? (
                  <InlineLink to={`/users/${order.user.id}`}>
                    {order.user.name} ({order.user.email})
                  </InlineLink>
                ) : (
                  'Unassigned'
                )}
              </dd>
              <dt>Source</dt>
              <dd>
                {order.stripeInvoiceId ? (
                  <BadgePill $tone="accent">Stripe synced</BadgePill>
                ) : (
                  <BadgePill $tone="neutral">Manual</BadgePill>
                )}
              </dd>
              <dt>Stripe Invoice ID</dt>
              <dd>{order.stripeInvoiceId || 'None'}</dd>
              <dt>Created</dt>
              <dd>{formatShortDate(order.createdAt)}</dd>
              <dt>Updated</dt>
              <dd>{formatShortDate(order.updatedAt)}</dd>
            </DetailList>
          </CardPanel>

          <CardPanel aria-label="Included products">
            <PanelTitle>Included Products ({order.products?.length ?? 0})</PanelTitle>
            {order.products && order.products.length > 0 ? (
              <ProductList>
                {order.products.map((product) => (
                  <ProductRow key={product.id}>
                    <InlineLink to={`/products/${product.id}`}>{product.name}</InlineLink>
                    <strong>{formatCurrency(product.price)}</strong>
                  </ProductRow>
                ))}
              </ProductList>
            ) : (
              <EmptyStateText>No products attached to this order.</EmptyStateText>
            )}
          </CardPanel>
        </DetailGrid>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        title={`Delete order #${id ?? ''}?`}
        description="This permanently deletes this order record. This action cannot be undone."
        confirmLabel="Delete Order"
        isConfirming={isDeleting}
        onConfirm={() => void handleDeleteOrder()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </PageWrapper>
  );
};

export default OrderDetails;
