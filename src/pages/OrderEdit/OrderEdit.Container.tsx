import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import {
  PageHeaderRow,
  PageHeaderText,
  PageSubtitle,
  PageTitle,
  PageWrapper,
} from '../../components/ui/PagePrimitives';
import OrderForm, { type OrderFormSubmitValues } from '../../elements/Forms/OrderForm';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useOrder } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import { useUsers } from '../../hooks/useUsers';
import { extractApiError } from '../../utils/helpers';

const OrderEdit = () => {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle(id ? `Edit Order #${id}` : 'Edit Order');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const orderQuery = useOrder(id);
  const productsQuery = useProducts();
  const usersQuery = useUsers();

  const handleSaveOrder = async (values: OrderFormSubmitValues) => {
    if (!id) return;
    setSubmitError(null);
    try {
      await axios.patch(`/v1/orders/${id}`, {
        total: values.total,
        userId: values.userId,
        stripeInvoiceId: values.stripeInvoiceId,
        productIds: values.productIds,
      });

      await queryClient.invalidateQueries({ queryKey: ['order', id] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });

      navigate(`/orders/${id}`, {
        state: {
          flash: {
            type: 'success',
            text: `Order #${id} updated successfully.`,
          },
        },
      });
    } catch (error) {
      setSubmitError(extractApiError(error, 'Failed to update order.'));
    }
  };

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: 'Orders', to: '/orders' },
          { label: `Order #${id ?? ''}`, to: `/orders/${id ?? ''}` },
          { label: 'Edit' },
        ]}
      />

      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Edit Order #{id}</PageTitle>
          <PageSubtitle>
            Update customer assignment, attached products, total, or invoice ID.
          </PageSubtitle>
        </PageHeaderText>
      </PageHeaderRow>

      {orderQuery.isLoading ? (
        <CircularProgress data-testid="order-edit-loading" />
      ) : orderQuery.error || !orderQuery.data ? (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => void orderQuery.refetch()}>
              Retry
            </Button>
          }
        >
          Order #{id} could not be loaded.
        </Alert>
      ) : (
        <OrderForm
          mode="edit"
          products={productsQuery.data ?? []}
          users={usersQuery.data ?? []}
          initialValues={{
            userId: orderQuery.data.userId,
            total: orderQuery.data.total,
            stripeInvoiceId: orderQuery.data.stripeInvoiceId,
            productIds: orderQuery.data.products?.map((p) => p.id) ?? [],
          }}
          cancelTo={`/orders/${id}`}
          submitLabel="Save Order Changes"
          submitError={submitError}
          onSubmitOrder={handleSaveOrder}
        />
      )}
    </PageWrapper>
  );
};

export default OrderEdit;
