import { useId, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  BadgePill,
  CardPanel,
  EmptyStateText,
  FilterToolbar,
  PageHeaderActions,
  PageHeaderRow,
  PageHeaderText,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  SearchInputBox,
  ToolbarSearchInput,
  VisuallyHidden,
} from '../../components/ui/PagePrimitives';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFlashMessage } from '../../hooks/useFlashMessage';
import { useProducts } from '../../hooks/useProducts';
import type { ApiProduct } from '../../types/api';
import { extractApiError, formatCurrency, formatShortDate } from '../../utils/helpers';

const TableWrapper = styled.div`
  overflow-x: auto;
  max-inline-size: 100%;

  &:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  min-inline-size: 640px;
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

const Th = styled.th`
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
  color: #334155;
  font-weight: 600;
  white-space: nowrap;
`;

const RowTh = styled.th`
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 600;
  color: #0f172a;
`;

const Td = styled.td`
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
`;

const ProductLink = styled(Link)`
  color: #1d4ed8;
  font-weight: 600;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

const RowActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
`;

const Products = () => {
  useDocumentTitle('Products');

  const queryClient = useQueryClient();
  const { flash, setFlash, clearFlash } = useFlashMessage();
  const idPrefix = useId();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 250);
  const [productToDelete, setProductToDelete] = useState<ApiProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const productsQuery = useProducts(debouncedSearch);
  const products = productsQuery.data ?? [];

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/v1/products/${productToDelete.id}`);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setFlash({ type: 'success', text: `Deleted product "${productToDelete.name}".` });
      setProductToDelete(null);
    } catch (error) {
      setFlash({
        type: 'error',
        text: extractApiError(error, `Failed to delete product "${productToDelete.name}".`),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const searchInputId = `${idPrefix}-products-search`;

  return (
    <PageWrapper>
      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Products</PageTitle>
          <PageSubtitle>
            {productsQuery.isLoading
              ? 'Loading catalog...'
              : `${products.length} product${products.length === 1 ? '' : 's'} in catalog`}
          </PageSubtitle>
        </PageHeaderText>
        <PageHeaderActions>
          <Button component={Link} to="/products/new" variant="contained" color="primary">
            Create Product
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

      <FilterToolbar aria-label="Filter products">
        <SearchInputBox>
          <SearchIcon fontSize="small" color="action" aria-hidden="true" />
          <label htmlFor={searchInputId}>
            <VisuallyHidden>Search products</VisuallyHidden>
          </label>
          <ToolbarSearchInput
            id={searchInputId}
            type="search"
            placeholder="Search products by name..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </SearchInputBox>

        {searchInput && (
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={() => setSearchInput('')}
          >
            Clear
          </Button>
        )}
      </FilterToolbar>

      <CardPanel>
        {productsQuery.isLoading ? (
          <CircularProgress data-testid="products-loading-circle" />
        ) : productsQuery.error ? (
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={() => void productsQuery.refetch()}>
                Retry
              </Button>
            }
          >
            Failed to load products.
          </Alert>
        ) : products.length === 0 ? (
          <EmptyStateText>
            {searchInput
              ? `No products found matching "${searchInput}".`
              : 'No products in catalog yet. Click "Create Product" to add your first item.'}
          </EmptyStateText>
        ) : (
          <TableWrapper tabIndex={0} role="region" aria-labelledby="products-table-caption">
            <StyledTable aria-label="products-table">
              <TableCaption id="products-table-caption">Products catalog</TableCaption>
              <thead>
                <tr>
                  <Th scope="col">Product</Th>
                  <Th scope="col">Price</Th>
                  <Th scope="col">Stripe</Th>
                  <Th scope="col">Created</Th>
                  <Th scope="col">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <RowTh scope="row">
                      <ProductLink to={`/products/${product.id}`}>{product.name}</ProductLink>
                    </RowTh>
                    <Td>
                      <strong>{formatCurrency(product.price)}</strong>
                    </Td>
                    <Td>
                      {product.stripeProductId ? (
                        <BadgePill $tone="accent" title={product.stripeProductId}>
                          {product.stripePriceId ? 'Checkout ready' : 'Linked'}
                        </BadgePill>
                      ) : (
                        <BadgePill $tone="neutral">Local only</BadgePill>
                      )}
                    </Td>
                    <Td>
                      {product.createdAt ? (
                        <time dateTime={product.createdAt}>
                          {formatShortDate(product.createdAt)}
                        </time>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td>
                      <RowActions>
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          component={Link}
                          to={`/products/${product.id}`}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          component={Link}
                          to={`/products/${product.id}/edit`}
                          aria-label={`Edit ${product.name}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          type="button"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => setProductToDelete(product)}
                        >
                          Delete
                        </Button>
                      </RowActions>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </TableWrapper>
        )}
      </CardPanel>

      <ConfirmDialog
        open={Boolean(productToDelete)}
        title={`Delete "${productToDelete?.name ?? ''}"?`}
        description="This permanently removes the product from the database. Existing orders referencing it will remain intact."
        confirmLabel="Delete Product"
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setProductToDelete(null)}
      />
    </PageWrapper>
  );
};

export default Products;
