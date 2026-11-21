import { useMemo, useState } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import type { ApiOrder } from '../../types/api';
import { formatCurrency, formatShortDate, getDateTimestamp } from '../../utils/helpers';
import { BadgePill, CardPanel, EmptyStateText, VisuallyHidden } from '../ui/PagePrimitives';

export type OrderSortColumn = 'id' | 'customer' | 'createdAt' | 'total' | 'source';
export type SortDirection = 'ascending' | 'descending';

export interface OrdersTableProps {
  orders: readonly ApiOrder[];
  onDeleteOrder?: (order: ApiOrder) => void;
  pageSize?: number;
}

const ITEMS_PER_PAGE = 10;
const textCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const TableWrapper = styled.div`
  overflow-x: auto;
  max-inline-size: 100%;
  container-type: inline-size;

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  min-inline-size: 760px;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 0.875rem;
`;

const TableCaption = styled.caption`
  position: absolute;
  clip-path: inset(50%);
  overflow: hidden;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  white-space: nowrap;
`;

const TableHead = styled.thead`
  position: sticky;
  inset-block-start: 0;
  z-index: 1;
  background-color: #f8fafc;
`;

const SortableHeaderCell = styled.th`
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #334155;
  padding: 0;
  white-space: nowrap;
`;

const PlainHeaderCell = styled.th`
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #334155;
  padding: 12px;
  white-space: nowrap;
`;

const SortButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  min-height: 44px;
  min-width: 24px;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: #f1f5f9;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: -2px;
  }
`;

const BodyRow = styled.tr`
  &:hover td,
  &:hover th {
    background-color: #f8fafc;
  }
`;

const RowHeaderCell = styled.th`
  position: sticky;
  inset-inline-start: 0;
  background-color: #ffffff;
  font-weight: 600;
  color: #0f172a;
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  white-space: nowrap;
`;

const BodyCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
`;

const CellLink = styled(Link)`
  color: #1d4ed8;
  font-weight: 600;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const ProductsCellText = styled.span`
  display: inline-block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
`;

const ActionsCellGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
`;

const PaginationBar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
`;

const PageControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const PageNavButton = styled.button`
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 6px 12px;
  min-height: 36px;
  border-radius: 6px;
  cursor: pointer;

  &:disabled {
    color: #94a3b8;
    border-color: #e2e8f0;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background-color: #f1f5f9;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const PageNumberButton = styled.button<{ $active: boolean }>`
  min-width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid ${({ $active }) => ($active ? '#1d4ed8' : '#cbd5e1')};
  font: inherit;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  background-color: ${({ $active }) => ($active ? '#1d4ed8' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#0f172a')};
  cursor: pointer;

  &:hover {
    background-color: ${({ $active }) => ($active ? '#1e40af' : '#f1f5f9')};
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const PageMeta = styled.span`
  font-size: 0.875rem;
  color: #475569;
`;

interface ColumnConfig {
  key: OrderSortColumn;
  label: string;
}

const SORTABLE_COLUMNS: Record<OrderSortColumn, ColumnConfig> = {
  id: { key: 'id', label: 'Order' },
  customer: { key: 'customer', label: 'Customer' },
  createdAt: { key: 'createdAt', label: 'Created' },
  total: { key: 'total', label: 'Total' },
  source: { key: 'source', label: 'Source' },
};

const compareOrders = (
  a: ApiOrder,
  b: ApiOrder,
  column: OrderSortColumn,
  direction: SortDirection,
): number => {
  const factor = direction === 'ascending' ? 1 : -1;

  switch (column) {
    case 'id':
      return factor * (a.id - b.id);
    case 'total':
      return factor * (a.total - b.total);
    case 'createdAt':
      return factor * (getDateTimestamp(a.createdAt) - getDateTimestamp(b.createdAt));
    case 'source':
      return (
        factor *
        textCollator.compare(
          a.stripeInvoiceId ? 'Stripe' : 'Manual',
          b.stripeInvoiceId ? 'Stripe' : 'Manual',
        )
      );
    case 'customer':
      return (
        factor * textCollator.compare(a.user?.name ?? 'Unassigned', b.user?.name ?? 'Unassigned')
      );
  }
};

const OrdersTable = ({ orders, onDeleteOrder, pageSize = ITEMS_PER_PAGE }: OrdersTableProps) => {
  const [sortColumn, setSortColumn] = useState<OrderSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('ascending');
  const [currentPage, setCurrentPage] = useState(1);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const sortedOrders = useMemo(() => {
    if (!sortColumn) {
      return orders;
    }
    return [...orders].sort((a, b) => compareOrders(a, b, sortColumn, sortDirection));
  }, [orders, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const visibleOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, safePage, pageSize]);

  const handleSort = (column: ColumnConfig) => {
    const nextDirection: SortDirection =
      sortColumn === column.key && sortDirection === 'ascending' ? 'descending' : 'ascending';

    setSortColumn(column.key);
    setSortDirection(nextDirection);
    setCurrentPage(1);
    setLiveAnnouncement(`Sorted by ${column.label}, ${nextDirection}, ${sortedOrders.length} rows`);
  };

  const renderSortHeader = (column: ColumnConfig) => {
    const isSorted = sortColumn === column.key;
    return (
      <SortableHeaderCell
        key={column.key}
        scope="col"
        aria-sort={isSorted ? sortDirection : undefined}
      >
        <SortButton type="button" onClick={() => handleSort(column)}>
          <span>{column.label}</span>
          {isSorted ? (
            sortDirection === 'ascending' ? (
              <ArrowUpwardIcon fontSize="inherit" aria-hidden="true" />
            ) : (
              <ArrowDownwardIcon fontSize="inherit" aria-hidden="true" />
            )
          ) : (
            <UnfoldMoreIcon fontSize="inherit" color="disabled" aria-hidden="true" />
          )}
        </SortButton>
      </SortableHeaderCell>
    );
  };

  return (
    <CardPanel>
      <VisuallyHidden role="status" aria-live="polite">
        {liveAnnouncement}
      </VisuallyHidden>

      {sortedOrders.length === 0 ? (
        <EmptyStateText>No orders match your current filters.</EmptyStateText>
      ) : (
        <>
          <TableWrapper tabIndex={0} role="region" aria-labelledby="orders-table-caption">
            <StyledTable aria-label="orders-table">
              <TableCaption id="orders-table-caption">Orders list</TableCaption>
              <TableHead>
                <tr>
                  {renderSortHeader(SORTABLE_COLUMNS.id)}
                  {renderSortHeader(SORTABLE_COLUMNS.customer)}
                  <PlainHeaderCell scope="col">Products</PlainHeaderCell>
                  {renderSortHeader(SORTABLE_COLUMNS.createdAt)}
                  {renderSortHeader(SORTABLE_COLUMNS.total)}
                  {renderSortHeader(SORTABLE_COLUMNS.source)}
                  <PlainHeaderCell scope="col">Actions</PlainHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {visibleOrders.map((order) => {
                  const productsLabel =
                    order.products && order.products.length > 0
                      ? order.products.map((p) => p.name).join(', ')
                      : 'No products';

                  return (
                    <BodyRow key={order.id}>
                      <RowHeaderCell scope="row" data-value={order.id}>
                        <CellLink to={`/orders/${order.id}`}>#{order.id}</CellLink>
                      </RowHeaderCell>
                      <BodyCell>
                        {order.user ? (
                          <CellLink to={`/users/${order.user.id}`}>{order.user.name}</CellLink>
                        ) : (
                          'Unassigned'
                        )}
                      </BodyCell>
                      <BodyCell>
                        <ProductsCellText title={productsLabel}>{productsLabel}</ProductsCellText>
                      </BodyCell>
                      <BodyCell data-value={getDateTimestamp(order.createdAt)}>
                        {order.createdAt ? (
                          <time dateTime={order.createdAt}>{formatShortDate(order.createdAt)}</time>
                        ) : (
                          '—'
                        )}
                      </BodyCell>
                      <BodyCell data-value={order.total}>
                        <strong>{formatCurrency(order.total)}</strong>
                      </BodyCell>
                      <BodyCell>
                        {order.stripeInvoiceId ? (
                          <BadgePill $tone="accent" title={order.stripeInvoiceId}>
                            Stripe
                          </BadgePill>
                        ) : (
                          <BadgePill $tone="neutral">Manual</BadgePill>
                        )}
                      </BodyCell>
                      <BodyCell>
                        <ActionsCellGroup>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            component={Link}
                            to={`/orders/${order.id}`}
                            aria-label={`View order #${order.id}`}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            component={Link}
                            to={`/orders/${order.id}/edit`}
                            aria-label={`Edit order #${order.id}`}
                          >
                            Edit
                          </Button>
                          {onDeleteOrder && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              type="button"
                              aria-label={`Delete order #${order.id}`}
                              onClick={() => onDeleteOrder(order)}
                            >
                              Delete
                            </Button>
                          )}
                        </ActionsCellGroup>
                      </BodyCell>
                    </BodyRow>
                  );
                })}
              </tbody>
            </StyledTable>
          </TableWrapper>

          {totalPages > 1 && (
            <PaginationBar aria-label="Orders pagination">
              <PageMeta>
                Page {safePage} of {totalPages} ({sortedOrders.length} orders)
              </PageMeta>
              <PageControls>
                <PageNavButton
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1}
                >
                  Previous
                </PageNavButton>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <PageNumberButton
                    key={pageNumber}
                    type="button"
                    $active={pageNumber === safePage}
                    aria-current={pageNumber === safePage ? 'page' : undefined}
                    aria-label={`Page ${pageNumber}`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </PageNumberButton>
                ))}

                <PageNavButton
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage >= totalPages}
                >
                  Next
                </PageNavButton>
              </PageControls>
            </PaginationBar>
          )}
        </>
      )}
    </CardPanel>
  );
};

export default OrdersTable;
