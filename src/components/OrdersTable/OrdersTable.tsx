import { useMemo, useState } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import styled from 'styled-components';
import { type Order, OrderStatus, type OrderStatusKeys } from '../../pages/UserInfo/UserInfo.State';
import {
  formatCurrency,
  formatOrderStatusLabel,
  formatShortDate,
  getDateTimestamp,
} from '../../utils/helpers';

export type OrderSortColumn =
  | 'productName'
  | 'status'
  | 'orderedDate'
  | 'totalAmount'
  | 'hasBeenReviewed';
export type SortDirection = 'ascending' | 'descending';

export interface OrdersTableProps {
  orders: Order[];
  filter?: OrderStatusKeys | undefined;
  onFilterChange?: (nextFilter: OrderStatusKeys | undefined) => void;
  searchQuery?: string;
  onSearchChange?: (nextQuery: string) => void;
  pageSize?: number;
}

const ITEMS_PER_PAGE = 6;
const textCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const SectionCard = styled.section`
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
`;

const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
`;

const SectionSubtitle = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
`;

const ControlsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 12px;
  min-height: 40px;

  &:focus-within {
    outline: 2px solid #0b57d0;
    outline-offset: 1px;
    background-color: #ffffff;
  }
`;

const NativeSearchInput = styled.input`
  border: 0;
  background: transparent;
  padding: 8px 0 8px 8px;
  font: inherit;
  font-size: max(1rem, 0.875rem);
  color: #111827;
  min-width: 170px;

  &:focus {
    outline: none;
  }
`;

const FilterWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0 10px;
  min-height: 40px;

  &:focus-within {
    outline: 2px solid #0b57d0;
    outline-offset: 1px;
    background-color: #ffffff;
  }
`;

const FilterSelect = styled.select`
  border: 0;
  background: transparent;
  font: inherit;
  font-size: max(1rem, 0.875rem);
  color: #111827;
  padding: 8px 4px;
  cursor: pointer;

  &:focus {
    outline: none;
  }
`;

const VisuallyHidden = styled.span`
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
  min-inline-size: 560px;
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
  background-color: #f9fafb;
`;

const HeaderCell = styled.th`
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
  padding: 0;
  white-space: nowrap;
`;

const SortButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  min-height: 40px;
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
    background-color: #f3f4f6;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: -2px;
  }
`;

const BodyRow = styled.tr`
  &:hover td,
  &:hover th {
    background-color: #f9fafb;
  }
`;

const RowHeaderCell = styled.th`
  position: sticky;
  inset-inline-start: 0;
  background-color: #ffffff;
  font-weight: 500;
  color: #111827;
  padding: 14px 12px;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
`;

const BodyCell = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  white-space: nowrap;
`;

const StatusBadge = styled.span<{ $status: OrderStatusKeys }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${({ $status }) => {
    switch ($status) {
      case OrderStatus.Shipped:
        return '#e5e7eb';
      case OrderStatus.Pending:
        return '#f3f4f6';
      case OrderStatus.OutOfStock:
        return '#fee2e2';
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case OrderStatus.Shipped:
        return '#1f2937';
      case OrderStatus.Pending:
        return '#374151';
      case OrderStatus.OutOfStock:
        return '#991b1b';
    }
  }};
`;

const PaginationBar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 16px;
`;

const PageNavButton = styled.button`
  border: 0;
  background: transparent;
  color: #111827;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 6px 10px;
  min-height: 36px;
  border-radius: 6px;
  cursor: pointer;

  &:disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background-color: #f3f4f6;
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const PageNumberButton = styled.button<{ $active: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 0;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  background-color: ${({ $active }) => ($active ? '#6b7280' : '#e5e7eb')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#111827')};
  cursor: pointer;

  &:hover {
    background-color: ${({ $active }) => ($active ? '#4b5563' : '#d1d5db')};
  }

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

interface ColumnConfig {
  key: OrderSortColumn;
  label: string;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'productName', label: 'Product' },
  { key: 'status', label: 'Status' },
  { key: 'orderedDate', label: 'Date' },
  { key: 'totalAmount', label: 'Total Amount' },
  { key: 'hasBeenReviewed', label: 'Reviewed' },
];

const compareOrders = (
  a: Order,
  b: Order,
  column: OrderSortColumn,
  direction: SortDirection,
): number => {
  const factor = direction === 'ascending' ? 1 : -1;

  switch (column) {
    case 'totalAmount':
      return factor * (a.totalAmount - b.totalAmount);
    case 'orderedDate': {
      const timeA = a.status === OrderStatus.OutOfStock ? 0 : getDateTimestamp(a.orderedDate);
      const timeB = b.status === OrderStatus.OutOfStock ? 0 : getDateTimestamp(b.orderedDate);
      return factor * (timeA - timeB);
    }
    case 'status':
      return (
        factor *
        textCollator.compare(formatOrderStatusLabel(a.status), formatOrderStatusLabel(b.status))
      );
    case 'hasBeenReviewed':
      return (
        factor *
        textCollator.compare(a.hasBeenReviewed ? 'Yes' : 'No', b.hasBeenReviewed ? 'Yes' : 'No')
      );
    case 'productName':
    default:
      return factor * textCollator.compare(a.productName, b.productName);
  }
};

const OrdersTable = ({
  orders,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  pageSize = ITEMS_PER_PAGE,
}: OrdersTableProps) => {
  const [localSearch, setLocalSearch] = useState('');
  const [localFilter, setLocalFilter] = useState<OrderStatusKeys | undefined>(undefined);
  const [sortColumn, setSortColumn] = useState<OrderSortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('ascending');
  const [currentPage, setCurrentPage] = useState(1);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const activeSearch = searchQuery !== undefined ? searchQuery : localSearch;
  const activeFilter = onFilterChange ? filter : localFilter;

  const handleSearchInput = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearch(value);
    }
    setCurrentPage(1);
  };

  const handleFilterSelect = (value: string) => {
    const parsed = value === '' ? undefined : (value as OrderStatusKeys);
    if (onFilterChange) {
      onFilterChange(parsed);
    } else {
      setLocalFilter(parsed);
    }
    setCurrentPage(1);
  };

  const filteredAndSortedOrders = useMemo(() => {
    const normalizedQuery = activeSearch.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      if (activeFilter && order.status !== activeFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return (
        order.productName.toLowerCase().includes(normalizedQuery) ||
        formatOrderStatusLabel(order.status).toLowerCase().includes(normalizedQuery)
      );
    });

    if (!sortColumn) {
      return filtered;
    }

    return [...filtered].sort((a, b) => compareOrders(a, b, sortColumn, sortDirection));
  }, [orders, activeFilter, activeSearch, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const visibleOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAndSortedOrders.slice(start, start + pageSize);
  }, [filteredAndSortedOrders, safePage, pageSize]);

  const handleSort = (column: ColumnConfig) => {
    const nextDirection: SortDirection =
      sortColumn === column.key && sortDirection === 'ascending' ? 'descending' : 'ascending';

    setSortColumn(column.key);
    setSortDirection(nextDirection);
    setCurrentPage(1);
    setLiveAnnouncement(
      `Sorted by ${column.label}, ${nextDirection}, ${filteredAndSortedOrders.length} rows`,
    );
  };

  return (
    <SectionCard aria-label="All orders section">
      <HeaderRow>
        <TitleBlock>
          <SectionTitle>All orders</SectionTitle>
          <SectionSubtitle>Monitor shipping status, date, etc.</SectionSubtitle>
        </TitleBlock>

        <div role="search" aria-label="Filter orders">
          <ControlsRow>
            <SearchInputWrapper>
              <SearchIcon fontSize="small" color="action" aria-hidden="true" />
              <label htmlFor="orders-table-search">
                <VisuallyHidden>Search orders</VisuallyHidden>
              </label>
              <NativeSearchInput
                id="orders-table-search"
                type="search"
                placeholder="Search orders"
                value={activeSearch}
                onChange={(event) => handleSearchInput(event.target.value)}
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
              />
            </SearchInputWrapper>

            <FilterWrapper>
              <FilterListIcon fontSize="small" color="action" aria-hidden="true" />
              <label htmlFor="orders-status-filter">
                <VisuallyHidden>Filter orders by status</VisuallyHidden>
              </label>
              <FilterSelect
                id="orders-status-filter"
                value={activeFilter ?? ''}
                onChange={(event) => handleFilterSelect(event.target.value)}
              >
                <option value="">Filter: All</option>
                <option value={OrderStatus.Shipped}>Shipped</option>
                <option value={OrderStatus.Pending}>Pending</option>
                <option value={OrderStatus.OutOfStock}>Out of Stock</option>
              </FilterSelect>
            </FilterWrapper>
          </ControlsRow>
        </div>
      </HeaderRow>

      <VisuallyHidden role="status" aria-live="polite">
        {liveAnnouncement}
      </VisuallyHidden>

      <TableWrapper tabIndex={0} role="region" aria-labelledby="orders-table-caption">
        <StyledTable aria-label="orders-table">
          <TableCaption id="orders-table-caption">All orders</TableCaption>
          <TableHead>
            <tr>
              {COLUMNS.map((column) => {
                const isSorted = sortColumn === column.key;
                return (
                  <HeaderCell
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
                  </HeaderCell>
                );
              })}
            </tr>
          </TableHead>
          <tbody>
            {visibleOrders.length === 0 ? (
              <tr>
                <BodyCell colSpan={5}>No orders match your criteria.</BodyCell>
              </tr>
            ) : (
              visibleOrders.map((order) => {
                const isOutOfStock = order.status === OrderStatus.OutOfStock;
                const formattedDate = isOutOfStock
                  ? 'No date available'
                  : formatShortDate(order.orderedDate);

                return (
                  <BodyRow key={order.id}>
                    <RowHeaderCell scope="row">{order.productName}</RowHeaderCell>
                    <BodyCell>
                      <StatusBadge $status={order.status}>
                        {formatOrderStatusLabel(order.status)}
                      </StatusBadge>
                    </BodyCell>
                    <BodyCell data-value={isOutOfStock ? 0 : getDateTimestamp(order.orderedDate)}>
                      {isOutOfStock ? (
                        formattedDate
                      ) : (
                        <time dateTime={order.orderedDate}>{formattedDate}</time>
                      )}
                    </BodyCell>
                    <BodyCell data-value={order.totalAmount}>
                      {formatCurrency(order.totalAmount)}
                    </BodyCell>
                    <BodyCell>{order.hasBeenReviewed ? 'Yes' : 'No'}</BodyCell>
                  </BodyRow>
                );
              })
            )}
          </tbody>
        </StyledTable>
      </TableWrapper>

      <PaginationBar aria-label="Orders pagination">
        <PageNavButton
          type="button"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={safePage <= 1}
        >
          Previous page
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
          Next page
        </PageNavButton>
      </PaginationBar>
    </SectionCard>
  );
};

export default OrdersTable;
