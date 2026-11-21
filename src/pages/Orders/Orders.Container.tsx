import { useId, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import OrdersTable from '../../components/OrdersTable';
import {
  FilterToolbar,
  PageHeaderActions,
  PageHeaderRow,
  PageHeaderText,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  SearchInputBox,
  ToolbarSearchInput,
  ToolbarSelect,
  VisuallyHidden,
} from '../../components/ui/PagePrimitives';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFlashMessage } from '../../hooks/useFlashMessage';
import { useOrders } from '../../hooks/useOrders';
import { useUsers } from '../../hooks/useUsers';
import type { ApiOrder } from '../../types/api';
import { extractApiError } from '../../utils/helpers';

type OrderSourceFilter = '' | 'stripe' | 'manual';

const EMPTY_ORDERS: ApiOrder[] = [];

const Orders = () => {
  useDocumentTitle('Orders');

  const queryClient = useQueryClient();
  const { flash, setFlash, clearFlash } = useFlashMessage();
  const idPrefix = useId();

  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<OrderSourceFilter>('');
  const [orderToDelete, setOrderToDelete] = useState<ApiOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const ordersQuery = useOrders();
  const usersQuery = useUsers();

  const orders = ordersQuery.data ?? EMPTY_ORDERS;
  const users = usersQuery.data ?? [];

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      if (customerFilter === 'unassigned' && order.userId !== null) {
        return false;
      }
      if (customerFilter && customerFilter !== 'unassigned') {
        if (String(order.userId ?? '') !== customerFilter) {
          return false;
        }
      }

      if (sourceFilter === 'stripe' && !order.stripeInvoiceId) {
        return false;
      }
      if (sourceFilter === 'manual' && order.stripeInvoiceId) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const productNames = (order.products ?? []).map((p) => p.name.toLowerCase()).join(' ');
      return (
        String(order.id).includes(normalizedQuery) ||
        productNames.includes(normalizedQuery) ||
        (order.user?.name.toLowerCase().includes(normalizedQuery) ?? false) ||
        (order.user?.email.toLowerCase().includes(normalizedQuery) ?? false) ||
        (order.stripeInvoiceId?.toLowerCase().includes(normalizedQuery) ?? false)
      );
    });
  }, [orders, searchQuery, customerFilter, sourceFilter]);

  const hasActiveFilters = Boolean(searchQuery.trim() || customerFilter || sourceFilter);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCustomerFilter('');
    setSourceFilter('');
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/v1/orders/${orderToDelete.id}`);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setFlash({ type: 'success', text: `Order #${orderToDelete.id} deleted.` });
      setOrderToDelete(null);
    } catch (error) {
      setFlash({
        type: 'error',
        text: extractApiError(error, `Failed to delete order #${orderToDelete.id}.`),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const searchInputId = `${idPrefix}-orders-search`;
  const customerSelectId = `${idPrefix}-orders-customer`;
  const sourceSelectId = `${idPrefix}-orders-source`;

  return (
    <PageWrapper>
      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Orders</PageTitle>
          <PageSubtitle>
            {ordersQuery.isLoading
              ? 'Loading orders...'
              : `${filteredOrders.length} of ${orders.length} orders`}
          </PageSubtitle>
        </PageHeaderText>
        <PageHeaderActions>
          <Button component={Link} to="/orders/new" variant="contained" color="primary">
            Create Order
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

      <FilterToolbar aria-label="Filter orders">
        <SearchInputBox>
          <SearchIcon fontSize="small" color="action" aria-hidden="true" />
          <label htmlFor={searchInputId}>
            <VisuallyHidden>Search orders</VisuallyHidden>
          </label>
          <ToolbarSearchInput
            id={searchInputId}
            type="search"
            placeholder="Search by order #, product, customer, or invoice..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </SearchInputBox>

        <label htmlFor={customerSelectId}>
          <VisuallyHidden>Filter by customer</VisuallyHidden>
        </label>
        <ToolbarSelect
          id={customerSelectId}
          aria-label="Filter by customer"
          value={customerFilter}
          onChange={(event) => setCustomerFilter(event.target.value)}
        >
          <option value="">All customers</option>
          <option value="unassigned">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={String(user.id)}>
              {user.name}
            </option>
          ))}
        </ToolbarSelect>

        <label htmlFor={sourceSelectId}>
          <VisuallyHidden>Filter by source</VisuallyHidden>
        </label>
        <ToolbarSelect
          id={sourceSelectId}
          aria-label="Filter by source"
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value as OrderSourceFilter)}
        >
          <option value="">All sources</option>
          <option value="stripe">Stripe synced</option>
          <option value="manual">Manual</option>
        </ToolbarSelect>

        {hasActiveFilters && (
          <Button type="button" variant="outlined" color="secondary" onClick={handleResetFilters}>
            Clear filters
          </Button>
        )}
      </FilterToolbar>

      {ordersQuery.isLoading ? (
        <CircularProgress data-testid="orders-loading" />
      ) : ordersQuery.error ? (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => void ordersQuery.refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load orders.
        </Alert>
      ) : (
        <OrdersTable orders={filteredOrders} onDeleteOrder={setOrderToDelete} />
      )}

      <ConfirmDialog
        open={Boolean(orderToDelete)}
        title={`Delete order #${orderToDelete?.id ?? ''}?`}
        description="This permanently removes the order record from the database. This action cannot be undone."
        confirmLabel="Delete Order"
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setOrderToDelete(null)}
      />
    </PageWrapper>
  );
};

export default Orders;
