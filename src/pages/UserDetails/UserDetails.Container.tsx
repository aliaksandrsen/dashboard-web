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
import { useUser } from '../../hooks/useUsers';
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

const OrdersList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const OrderRow = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
`;

const OrderLink = styled(Link)`
  color: #1d4ed8;
  font-weight: 600;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

const OrderMeta = styled.div`
  font-size: 0.8125rem;
  color: #475569;
`;

const UserDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { flash, setFlash, clearFlash } = useFlashMessage();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isLoading, error, data: user, refetch } = useUser(id);
  useDocumentTitle(user ? user.name : `User #${id ?? ''}`);

  const handleDeleteUser = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/v1/users/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/users', {
        state: {
          flash: {
            type: 'success',
            text: `Deleted user "${user?.name ?? `#${id}`}".`,
          },
        },
      });
    } catch (err) {
      setFlash({
        type: 'error',
        text: extractApiError(err, 'Failed to delete user.'),
      });
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: 'Users', to: '/users' },
          { label: user ? user.name : `User #${id ?? ''}` },
        ]}
      />

      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>{user ? user.name : `User #${id}`}</PageTitle>
        </PageHeaderText>
        <PageHeaderActions>
          {user && (
            <>
              <Button
                component={Link}
                to={`/orders/new?userId=${user.id}`}
                variant="outlined"
                color="primary"
              >
                Create Order
              </Button>
              <Button
                component={Link}
                to={`/users/${user.id}/edit`}
                variant="contained"
                color="primary"
              >
                Edit User
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="error"
                onClick={() => setIsDeleteOpen(true)}
              >
                Delete User
              </Button>
            </>
          )}
          <Button component={Link} to="/users" variant="outlined" color="secondary">
            Back to Users
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
        <CircularProgress data-testid="user-details-loading" />
      ) : error || !user ? (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          User #{id} could not be loaded.
        </Alert>
      ) : (
        <DetailGrid>
          <CardPanel aria-label="Customer overview">
            <PanelTitle>Customer Overview</PanelTitle>
            <DetailList>
              <dt>User ID</dt>
              <dd>#{user.id}</dd>
              <dt>Name</dt>
              <dd>{user.name}</dd>
              <dt>Email</dt>
              <dd>{user.email}</dd>
              <dt>Address</dt>
              <dd>{user.address}</dd>
            </DetailList>
          </CardPanel>

          <CardPanel aria-label="Customer orders">
            <PanelTitle>Customer Orders ({user.orders?.length ?? 0})</PanelTitle>
            {user.orders && user.orders.length > 0 ? (
              <OrdersList>
                {user.orders.map((order) => (
                  <OrderRow key={order.id}>
                    <div>
                      <OrderLink to={`/orders/${order.id}`}>
                        Order #{order.id}
                        {order.products && order.products.length > 0
                          ? ` — ${order.products.map((p) => p.name).join(', ')}`
                          : ''}
                      </OrderLink>
                      <OrderMeta>{formatShortDate(order.createdAt)}</OrderMeta>
                    </div>
                    <strong>{formatCurrency(order.total)}</strong>
                  </OrderRow>
                ))}
              </OrdersList>
            ) : (
              <EmptyStateText>This customer has no orders yet.</EmptyStateText>
            )}
          </CardPanel>
        </DetailGrid>
      )}

      <ConfirmDialog
        open={isDeleteOpen}
        title={`Delete "${user?.name ?? `User #${id ?? ''}`}"?`}
        description="This permanently deletes this customer record. Existing orders will remain as unassigned."
        confirmLabel="Delete User"
        isConfirming={isDeleting}
        onConfirm={() => void handleDeleteUser()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </PageWrapper>
  );
};

export default UserDetails;
