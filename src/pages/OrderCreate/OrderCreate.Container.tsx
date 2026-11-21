import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { useProducts } from '../../hooks/useProducts';
import { useUsers } from '../../hooks/useUsers';
import type { ApiOrder } from '../../types/api';
import { extractApiError } from '../../utils/helpers';

const OrderCreate = () => {
  useDocumentTitle('Create Order');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const productsQuery = useProducts();
  const usersQuery = useUsers();

  const preselectedUserParam = searchParams.get('userId');
  const preselectedUserId =
    preselectedUserParam && !Number.isNaN(Number(preselectedUserParam))
      ? Number(preselectedUserParam)
      : null;

  const handleCreateOrder = async (values: OrderFormSubmitValues) => {
    setSubmitError(null);
    try {
      const response = await axios.post<ApiOrder>('/v1/orders', {
        total: values.total,
        ...(values.userId !== null ? { userId: values.userId } : {}),
        ...(values.stripeInvoiceId ? { stripeInvoiceId: values.stripeInvoiceId } : {}),
        ...(values.productIds.length > 0 ? { productIds: values.productIds } : {}),
      });

      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });

      navigate('/orders', {
        state: {
          flash: {
            type: 'success',
            text: `Order #${response.data.id} created successfully.`,
          },
        },
      });
    } catch (error) {
      setSubmitError(extractApiError(error, 'Failed to create order. Please try again.'));
    }
  };

  return (
    <PageWrapper>
      <Breadcrumbs items={[{ label: 'Orders', to: '/orders' }, { label: 'Create Order' }]} />

      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Create Order</PageTitle>
          <PageSubtitle>
            Assign a customer, attach catalog products, and set the total.
          </PageSubtitle>
        </PageHeaderText>
      </PageHeaderRow>

      <OrderForm
        mode="create"
        products={productsQuery.data ?? []}
        users={usersQuery.data ?? []}
        initialValues={preselectedUserId ? { userId: preselectedUserId } : undefined}
        cancelTo="/orders"
        submitError={submitError}
        onSubmitOrder={handleCreateOrder}
      />
    </PageWrapper>
  );
};

export default OrderCreate;
