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
import { useUsers } from '../../hooks/useUsers';
import type { ApiUser } from '../../types/api';
import { extractApiError } from '../../utils/helpers';

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
  min-inline-size: 680px;
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

const UserLink = styled(Link)`
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

const Users = () => {
  useDocumentTitle('Users');

  const queryClient = useQueryClient();
  const { flash, setFlash, clearFlash } = useFlashMessage();
  const idPrefix = useId();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 250);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const usersQuery = useUsers(debouncedSearch);
  const users = usersQuery.data ?? [];

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/v1/users/${userToDelete.id}`);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      setFlash({ type: 'success', text: `Deleted user "${userToDelete.name}".` });
      setUserToDelete(null);
    } catch (error) {
      setFlash({
        type: 'error',
        text: extractApiError(error, `Failed to delete user "${userToDelete.name}".`),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const searchInputId = `${idPrefix}-users-search`;

  return (
    <PageWrapper>
      <PageHeaderRow>
        <PageHeaderText>
          <PageTitle>Users</PageTitle>
          <PageSubtitle>
            {usersQuery.isLoading
              ? 'Loading users...'
              : `${users.length} registered customer${users.length === 1 ? '' : 's'}`}
          </PageSubtitle>
        </PageHeaderText>
        <PageHeaderActions>
          <Button component={Link} to="/users/new" variant="contained" color="primary">
            Create User
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

      <FilterToolbar aria-label="Filter users">
        <SearchInputBox>
          <SearchIcon fontSize="small" color="action" aria-hidden="true" />
          <label htmlFor={searchInputId}>
            <VisuallyHidden>Search users</VisuallyHidden>
          </label>
          <ToolbarSearchInput
            id={searchInputId}
            type="search"
            placeholder="Search users by name or email..."
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
        {usersQuery.isLoading ? (
          <CircularProgress data-testid="users-loading-circle" />
        ) : usersQuery.error ? (
          <Alert
            severity="error"
            action={
              <Button size="small" onClick={() => void usersQuery.refetch()}>
                Retry
              </Button>
            }
          >
            Failed to load users.
          </Alert>
        ) : users.length === 0 ? (
          <EmptyStateText>
            {searchInput
              ? `No users found matching "${searchInput}".`
              : 'No users registered yet. Click "Create User" to add your first customer.'}
          </EmptyStateText>
        ) : (
          <TableWrapper tabIndex={0} role="region" aria-labelledby="users-table-caption">
            <StyledTable aria-label="users-table">
              <TableCaption id="users-table-caption">Registered users</TableCaption>
              <thead>
                <tr>
                  <Th scope="col">Name</Th>
                  <Th scope="col">Email</Th>
                  <Th scope="col">Address</Th>
                  <Th scope="col">Orders</Th>
                  <Th scope="col">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <RowTh scope="row">
                      <UserLink to={`/users/${user.id}`}>{user.name}</UserLink>
                    </RowTh>
                    <Td>{user.email}</Td>
                    <Td>{user.address}</Td>
                    <Td>{user.orders?.length ?? 0}</Td>
                    <Td>
                      <RowActions>
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          component={Link}
                          to={`/users/${user.id}`}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          component={Link}
                          to={`/users/${user.id}/edit`}
                          aria-label={`Edit ${user.name}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          type="button"
                          aria-label={`Delete ${user.name}`}
                          onClick={() => setUserToDelete(user)}
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
        open={Boolean(userToDelete)}
        title={`Delete "${userToDelete?.name ?? ''}"?`}
        description="This permanently deletes the user account. Any associated orders will remain as unassigned."
        confirmLabel="Delete User"
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setUserToDelete(null)}
      />
    </PageWrapper>
  );
};

export default Users;
